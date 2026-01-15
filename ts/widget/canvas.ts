///<reference path="widget/core.ts" />

namespace game_ts {
//
let animationFrameId : number | null = null;
const uiToCanvas = new Map<UI,Canvas>();

export function getAllUISub(all_uis : UI[], ui : UI){
    all_uis.push(ui);
    if(ui instanceof ContainerUI){
        ui.children.forEach(x => getAllUISub(all_uis, x));
    }
}

function getUIFromIdSub(id : string, ui : UI) : UI | undefined {
    if(ui.id == id){
        return ui;
    }

    if(ui instanceof ContainerUI){

        for(const child of ui.children){

            const ui2 = getUIFromIdSub(id, child);
            if(ui2 != undefined){
                return ui2;
            }
        }
    }

    return undefined;
}

export function getUIFromId(id : string) : UI {
    for(const canvas of Canvas.canvases){
        for(const ui of canvas.getUIMenus()){
            const ui2 = getUIFromIdSub(id, ui);
            if(ui2 != undefined){
                return ui2;
            }
        }

    }

    throw new MyError();
}

export function getCanvasFromUI(ui : UI) : Canvas {
    let canvas = uiToCanvas.get(ui);
    if(canvas != undefined){
        return canvas;
    }

    let root : UI;
    for(let ui2 : UI | undefined = ui; ui2 != undefined; ui2 = ui2.parent){
        if(ui2 instanceof PopupMenu){
            if(ui2.canvas == undefined){
                throw new MyError();
            }

            return ui2.canvas;
        }

        root = ui2;
    }

    for(const canvas of Canvas.canvases){
        if(canvas.getUIMenus().some(x => x == root)){
            uiToCanvas.set(ui, canvas);
            return canvas;
        }
    }

    throw new MyError();
}
function isTransparent(ctx : CanvasRenderingContext2D, position : Vec2) {
    try {
        // 1x1ピクセルの領域のImageDataを取得
        const imageData = ctx.getImageData(position.x, position.y, 1, 1);
        
        // data配列のインデックス3（4番目）がAlpha値 (0-255)
        // Alpha値が0であれば完全に透明
        return imageData.data[3] === 0;

    } catch (e) {
        // セキュリティ制限 (Tainted Canvas) などでエラーが発生した場合の処理
        console.error("getImageData エラー:", e);
        return false; // またはエラー処理に応じた値を返す
    }
}

export function updateRoot(ui : UI){
    const root = ui.getRootUI();
    root.setMinSize();
    root.layout(root.position, getDocumentSize());

    Canvas.requestUpdateCanvas();
}

export class Canvas {
    canvas : HTMLCanvasElement;
    ctx : CanvasRenderingContext2D;

    static isReady : boolean = false;
    static canvases: Canvas[] = [];
    static borderWidth : number = 5;
    static padding : Padding = new Padding(5, 5, 5, 5);
    static fontFamily : string = "Arial";
    static fontSize   : string = "30px";

    private uis: UI[] = [];
    private chars : string[] = [];

    targetUI? : UI;

    pointerId : number = NaN;

    downPos  : Vec2 = Vec2.zero();
    movePos  : Vec2 = Vec2.zero();
    uiOrgPos : Vec2 = Vec2.zero();

    moved : boolean = false;

    constructor(canvas_html : HTMLCanvasElement){
        Canvas.canvases.push(this);
        this.canvas = canvas_html;

        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width  = rect.width;
        this.canvas.height = rect.height;


        this.ctx = this.canvas.getContext('2d')!; // Or 'webgl', 'webgl2'
        if (!this.ctx) {
            console.error("Canvas context not supported!");
        }

        this.canvas.addEventListener("pointerdown",  this.pointerdown.bind(this));
        this.canvas.addEventListener("pointermove",  this.pointermove.bind(this));
        
        this.canvas.addEventListener("pointerup"  , async (ev:PointerEvent)=>{
            await this.pointerup(ev);
        });

        this.canvas.addEventListener("contextmenu", this.contextmenu.bind(this));

        this.canvas.addEventListener('keydown', this.keydown.bind(this));



        msg(`canvas w:${canvas_html.width} h:${canvas_html.height}`);
    }

    clearUIs(){
        this.uis = [];
    }

    getUIs() : UI[] {
        return this.uis.slice();
    }

    getUIMenus() : UI[]{
        const ui_menus = this.uis.slice();
        if(PopupMenu.one != undefined && PopupMenu.one.canvas == this){
            ui_menus.push(PopupMenu.one);
        }

        return ui_menus;
    }

    addUI(ui : UI){
        this.uis.push(ui);
    }

    getPositionInCanvas(event : PointerEvent) : Vec2 {
        // Get the bounding rectangle of the canvas
        const rect = this.canvas.getBoundingClientRect();

        // Calculate the scaling factors if the canvas is styled differently from its internal resolution
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        // Calculate the canvas coordinates
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;

        return new Vec2(canvasX, canvasY);
        // Now you have the canvas coordinates!
        // console.log(`Canvas X: ${canvasX}, Canvas Y: ${canvasY}`);
    }

    getUIFromPosition(pos : Vec2) : UI | undefined {
        for(const ui of this.getUIMenus().reverse()){
            const near_ui = ui.getNearUI(pos);
            if(near_ui != undefined){
                if(near_ui instanceof ImageUI){
                    if(isTransparent(this.ctx, pos)){
                        return near_ui.parent;
                    }
                }
                return near_ui;
            }
        }

        return undefined;
    }

    dragTarget(target : UI) : void {
        const diff = this.movePos.sub(this.downPos);
        const ui_new_pos = this.uiOrgPos.add(diff);
        target.setPosition(ui_new_pos);
    }

    pointerdown(ev:PointerEvent){
        this.moved = false;

        const pos = this.getPositionInCanvas(ev);
        const target = this.getUIFromPosition(pos);
        if(target != undefined){
            // msg(`down:${target.constructor.name}`);
            this.downPos   = pos;
            this.movePos   = pos;
            this.targetUI = target;

            this.uiOrgPos  = target.position.copy();
            this.pointerId = ev.pointerId;

            this.canvas.setPointerCapture(this.pointerId);
            this.canvas.classList.add('dragging');
        }
    }

    pointermove(ev:PointerEvent){
        this.moved = true;

        if(this.targetUI == undefined){
            return;
        }

        const pos = this.getPositionInCanvas(ev);
        const target = this.getUIFromPosition(pos);
        const s = (target == undefined ? "" : `target:[${target.str()}]`);

        this.movePos = pos;

        this.dragTarget(this.targetUI);

        Canvas.requestUpdateCanvas();
    }

    layoutCanvas(){
        for(const root of this.uis){
            root.setMinSize();
            root.layout(root.position, getDocumentSize());
        }

        Canvas.requestUpdateCanvas();
    }

    static requestUpdateCanvas(){
        if (Canvas.isReady && animationFrameId == null) {

            animationFrameId = requestAnimationFrame(()=>{
                animationFrameId = null;
                Canvas.canvases.forEach(x => x.repaint());

                Sequencer.nextAction();
            });

        }        
    }

    async pointerup(ev:PointerEvent){
        if(this.targetUI == undefined){
            return;
        }
        const target = this.targetUI;
        PopupMenu.close();


        if(this.moved){
            msg("dragged");
        }
        else{
            if(target instanceof Label && target.parent != undefined && target.parent.name == "numpad"){
                if(target.text == "Enter"){
                    const n = parseInt(this.chars.join(""));
                    if(isNaN(n)){
                        msg(`illegal number:${this.chars}`);
                    }
                    else{
                        msg(`input number:${n}`)
                    }

                    this.chars = [];
                }
                else{
                    msg(`num-pad:${target.text}`);
                    this.chars.push(target.text);
                }
            }
            else{

                const name = target.name;

                msg(`click:${target.idx} ${target.constructor.name} ${name == undefined ? "" : name} ${target.parent} pos:${target.position} size:${target.size}`);


                await target.click();
            }
        }

        this.canvas.releasePointerCapture(this.pointerId);
        this.canvas.classList.remove('dragging');

        this.targetUI = undefined;
        this.pointerId = NaN;

        Canvas.requestUpdateCanvas();

        this.moved = false;
    }

    contextmenu(event : MouseEvent){
        msg("context menu");
        // 1. デフォルトの右クリックメニューを禁止
        event.preventDefault();

        // 2. Canvas内での相対座標を計算
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        showPopupMenu(this, x, y);
    }

    keydown(ev: KeyboardEvent){
        // 特定のキーを判定
        switch (ev.key) {
        case 'Escape':
            msg('Escキーが押されました');
            PopupMenu.close();
            Canvas.requestUpdateCanvas();
            break;

        case 'Enter':
            msg('Enterキーが押されました');
            // 確定処理など
            break;

        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
            msg(`${ev.key} が押されました`);
            // 矩形の移動処理など
            ev.preventDefault(); // 矢印キーによる画面スクロールを防止
            break;
        }
    }



    resizeCanvas() {
        // Set the canvas's internal drawing dimensions to match its display size
        // window.innerWidth/Height give the viewport dimensions.
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // If you're drawing something, you might want to redraw it here
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
            // Example drawing
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(50, 50, 100, 100);
            this.ctx.font = `${Canvas.fontSize} ${Canvas.fontFamily}`;
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('Hello Canvas!', this.canvas.width / 2 - 100, this.canvas.height / 2);
        }

        Canvas.requestUpdateCanvas();
    }

    repaint(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);        
        this.getUIMenus().forEach(ui => ui.drawTop(this.ctx));
    }

    drawLine(start : Vec2, end : Vec2, color : string, lineWidth : number = 2){
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth   = lineWidth;

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);

        this.ctx.stroke();
    }
}


}