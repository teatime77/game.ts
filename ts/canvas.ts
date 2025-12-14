namespace game_ts {
//
let animationFrameId : number | null = null;

export class Canvas {
    static one : Canvas;

    canvas : HTMLCanvasElement;
    ctx : CanvasRenderingContext2D;

    uis: UI[] = [];

    targetUI? : UI;

    pointerId : number = NaN;

    downPos  : Vec2 = Vec2.zero();
    movePos  : Vec2 = Vec2.zero();
    uiOrgPos : Vec2 = Vec2.zero();

    moved : boolean = false;

    constructor(canvas_html : HTMLCanvasElement){
        Canvas.one = this;
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
            await Canvas.one.pointerup(ev);
        });

        msg(`canvas w:${canvas_html.width} h:${canvas_html.height}`);
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
        for(const ui of this.uis){
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
            msg(`down:${target.constructor.name}`);
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

        this.requestUpdateCanvas();
    }

    requestUpdateCanvas(){
        if (animationFrameId == null) {

            animationFrameId = requestAnimationFrame(()=>{
                animationFrameId = null;
                this.repaint();

                Sequencer.nextAction();
            });

        }        
    }

    async pointerup(ev:PointerEvent){
        if(this.targetUI == undefined){
            return;
        }

        const pos = this.getPositionInCanvas(ev);
        const target = this.getUIFromPosition(pos);

        if(this.moved){
            msg("dragged");
        }
        else{
            msg(`click:${this.targetUI.constructor.name}`);

            await this.targetUI.click();
        }

        this.canvas.releasePointerCapture(this.pointerId);
        this.canvas.classList.remove('dragging');

        this.targetUI = undefined;
        this.pointerId = NaN;

        this.requestUpdateCanvas();

        this.moved = false;
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
            this.ctx.font = '30px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('Hello Canvas!', this.canvas.width / 2 - 100, this.canvas.height / 2);
        }

        this.requestUpdateCanvas();
    }

    repaint(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);        
        this.uis.forEach(ui => ui.draw(this.ctx, Vec2.zero()));
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