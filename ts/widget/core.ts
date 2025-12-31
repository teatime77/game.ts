namespace game_ts {
//

export interface Movable {
    getPosition() : Vec2;
    setPosition(position : Vec2) : void;
}

export class Padding {
    left   : number;
    right  : number;
    top    : number;
    bottom : number;

    constructor(left : number, right : number, top : number, bottom : number){
        this.left  = left;
        this.right  = right;
        this.top    = top;
        this.bottom = bottom;
    }
}

export interface UIAttr {
    className? : string;
    id?   : string;
    name? : string;
    position? : [number, number];
    size?     : [number, number];
    borderStyle? : string;
    borderWidth? : number;
    backgroundColor? : string;
    padding? : number | [number, number] | [number, number, number, number];
    imageFile? : string;

    colSpan? : number;
    rowSpan? : number;
}

export interface TextUIAttr extends UIAttr {
    text? : string;
    fontFamily? : string;
    fontSize? : string;
    textAlign? : string;
}

export abstract class UI implements Movable {
    static count : number = 0;

    className : string;
    idx      : number;
    id?      : string;
    name? : string;
    parent?  : ContainerUI | TreeNode;
    position : Vec2 = Vec2.zero();
    fixedSize? : Vec2;
    size     : Vec2 = Vec2.zero();
    minSize  : Vec2 = Vec2.zero();
    backgroundColor? : string;
    color?           : string;
    borderWidth? : number;
    padding? : Padding;

    colIdx! : number;
    rowIdx! : number;

    colSpan? : number;
    rowSpan? : number;

    clickHandler? : ()=>Promise<void>;

    setParent(parent : ContainerUI | TreeNode){
        this.parent = parent;
        // msg(`set parent:${this.constructor.name} ${this.parent.constructor.name}`)
    }

    getRootUI() : UI {
        let ui : UI = this;
        for(; ui.parent != undefined; ui = ui.parent);
        return ui;
    }

    getPadding() : Padding {
        return (this.padding !== undefined ? this.padding : Canvas.padding);
    }

    getBorderWidth() : number {
        return this.borderWidth !== undefined ? this.borderWidth : Canvas.borderWidth;
    }

    getPaddingBorderSize() : Vec2 {
        const padding = this.getPadding();
        const borderWidth = this.getBorderWidth();

        const width  = padding.left + padding.right  + 2 * borderWidth;
        const height = padding.top  + padding.bottom + 2 * borderWidth;
        return Vec2.fromXY(width, height);
    }

    getContentPosition(){
        const borderWidth = this.getBorderWidth();
        const padding = this.getPadding();

        return Vec2.fromXY(borderWidth + padding.left, borderWidth + padding.top);
    }

    getColSpan() : number {
        return this.colSpan == undefined ? 1 : this.colSpan;
    }

    getRowSpan() : number {
        return this.rowSpan == undefined ? 1 : this.rowSpan;
    }

    isVisible(offset : Vec2, visibleArea : VisibleArea | undefined) : boolean {
        if(visibleArea == undefined){
            return true;
        }

        const x1 = offset.x + this.position.x;
        const y1 = offset.y + this.position.y;

        const x2 = x1 + this.size.x;
        const y2 = y1 + this.size.y;

        if(x2 < visibleArea.x1 || visibleArea.x2 < x1 || y2 < visibleArea.y1 || visibleArea.y2 < y1){
            return false;
        }

        return true;
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2, visibleArea : VisibleArea | undefined) : void {
        this.drawBorder(ctx, offset);
    }

    str() : string {
        return `${this.idx} ${this.constructor.name}`;
    }

    constructor(data : UIAttr){
        this.className = this.constructor.name;
        this.idx      = UI.count++;

        if(data.id !== undefined){
            this.id = data.id;
            addObject(this.id, this);
        }

        if(data.name !== undefined){
            this.name = data.name;
        }

        if(data.padding !== undefined){
            if(typeof data.padding == "number"){
                this.padding = new Padding(data.padding, data.padding, data.padding, data.padding);
            }
            else if(data.padding.length == 2){
                this.padding = new Padding(data.padding[0], data.padding[0], data.padding[1], data.padding[1]);
            }
            else{
                this.padding = new Padding(... data.padding);
            }
        }

        if(data.position !== undefined){
            this.position = new Vec2(data.position[0], data.position[1]);
        }

        if(data.size !== undefined){
            this.fixedSize     = new Vec2(data.size[0], data.size[1]);
        }
        // this.minSize = this.size.copy();

        if(data.colSpan !== undefined){
            this.colSpan = data.colSpan;
        }

        if(data.rowSpan !== undefined){
            this.rowSpan = data.rowSpan;
        }

        this.backgroundColor = data.backgroundColor;

        if(data.borderWidth !== undefined){
            this.borderWidth = data.borderWidth;
        }
    }

    absPosition() : Vec2 {
        let ui : UI = this;
        let pos = this.position;
        while(ui.parent !== undefined){
            ui = ui.parent;
            pos = pos.add(ui.position);
        }

        return pos;
    }

    getPosition() : Vec2 {
        return this.position.copy();
    }

    setPosition(position : Vec2) : void {
        this.position.copyFrom(position);
    }

    setMinSize() : void {
        if(this.fixedSize !== undefined){

            this.minSize.copyFrom(this.fixedSize);
        }
        else{

            this.minSize.copyFrom(this.getPaddingBorderSize());
        }

        this.size.copyFrom(this.minSize);
    }

    layout(position : Vec2, size : Vec2) : void {
        this.position.copyFrom(position);
        this.size.copyFrom(size);
    }

    layoutXY(x : number, y : number) : void {
        this.layout(Vec2.fromXY(x, y), this.size);
    }

    updateLayout(){
        this.layout(this.position, this.size);
    }

    isNear(position : Vec2) : boolean {
        if(this.position.x <= position.x && position.x < this.position.x + this.size.x){
            if(this.position.y <= position.y && position.y < this.position.y + this.size.y){
                return true;
            }
        }

        return false;
    }

    getNearUI(position : Vec2) : UI | undefined {
        if(this.isNear(position)){
            return this;
        }
        else{
            return undefined;
        }
    }

    async click(){
        if(this.clickHandler !== undefined){
            await this.clickHandler();
        }

        if(this.name == "play"){
            Sequencer.start();
        }
    }

    drawBorder(ctx : CanvasRenderingContext2D, offset : Vec2) {
        const borderWidth = this.getBorderWidth();
        if(borderWidth == 0){
            return;
        }

        const x1 = offset.x + this.position.x;
        const y1 = offset.y + this.position.y;
        const width  = this.size.x;
        const height = this.size.y;

        if(borderWidth == 1){
            ctx.strokeStyle = "white";
            ctx.strokeRect(x1, y1, width, height);
            return;
        }

        const x2 = x1 + borderWidth / 2;
        const y2 = y1 + borderWidth / 2;

        const x3 = x1 + borderWidth;
        const y3 = y1 + borderWidth;

        const x4 = x1 + width  - borderWidth;
        const y4 = y1 + height - borderWidth;

        const x5 = x1 + width  - borderWidth / 2;
        const y5 = y1 + height - borderWidth / 2;

        const x6 = x1 + width;
        const y6 = y1 + height;

        const light_dark_sides = [
            [
                [ x1, y1 ],
                [ x1, y6 ],
                [ x2, y5 ],
                [ x2, y2 ],
                [ x5, y2 ],
                [ x6, y1 ]
            ]
            ,
            [
                [ x2, y5 ],
                [ x5, y5 ],
                [ x5, y2 ],
                [ x4, y3 ],
                [ x4, y4 ],
                [ x3, y4 ]
            ]
            ,
            [
                [ x2, y2 ],
                [ x2, y5 ],
                [ x3, y4 ],
                [ x3, y3 ],
                [ x4, y3 ],
                [ x5, y2 ]
            ],
            [
                [ x1, y6 ],
                [ x6, y6 ],
                [ x6, y1 ],
                [ x5, y2 ],
                [ x5, y5 ],
                [ x2, y5 ]
            ]
        ];

        // const x : number, y : number, width : number, height : number, ridgeWidth : number
        // Define light and dark colors
        // const lightColor = isInset ? '#888' : '#eee'; // Darker for inset top/left
        // const darkColor = isInset ? '#eee' : '#888';  // Lighter for inset bottom/right

        const lightColor = "#ffffff";
        const darkColor = "#888888";
        const backgroundColor = (this.backgroundColor != undefined ? this.backgroundColor : "#cccccc");


        for(const [light_dark, sides] of light_dark_sides.entries()){
            if(light_dark <= 1){
                ctx.fillStyle = lightColor;
            }
            else{
                ctx.fillStyle = darkColor;
            }

            ctx.beginPath();
            for(const [idx, [x,y]] of sides.entries()){
                if(idx == 0){
                    ctx.moveTo(x, y);
                }
                else{
                    ctx.lineTo(x, y);
                }
            }

            ctx.closePath();
            ctx.fill();
        }

        return;


        // Optionally, draw the inner rectangle (fill or another stroke)
        ctx.fillStyle = backgroundColor; // Example inner color
        ctx.fillRect(x3, y3, width - 2 * borderWidth, height - 2 * borderWidth);

        // Draw the "light" sides (top and left)
        ctx.strokeStyle = lightColor;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.moveTo(x2, y1 + height - borderWidth / 2); // Bottom-left corner
        ctx.lineTo(x2, y2);     // Top-left corner
        ctx.lineTo(x1 + width - borderWidth / 2, y2); // Top-right corner
        ctx.stroke();

        // Draw the "dark" sides (bottom and right)
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.moveTo(x1 + width - borderWidth / 2, y2);     // Top-right corner
        ctx.lineTo(x1 + width - borderWidth / 2, y1 + height - borderWidth / 2); // Bottom-right corner
        ctx.lineTo(x2, y1 + height - borderWidth / 2); // Bottom-left corner
        ctx.stroke();
    }

}


export function makeUIFromObj(obj : any) : UI {
    if(obj instanceof UI){
        return obj;
    }
    
    const attr = obj as UIAttr;

    switch(attr.className){
    case Label.name  : return new Label(obj as TextUIAttr);
    case Button.name : return new Button(obj as TextUIAttr);
    case ImageUI.name: return new ImageUI(obj as UIAttr);
    case Star.name   : return new Star(obj as UIAttr);
    case Firework.name: return new Firework(obj as (UIAttr & { numStars: number}));
    case HorizontalSlider.name: return new HorizontalSlider(obj as UIAttr);
    case VerticalSlider.name  : return new VerticalSlider(obj as UIAttr);
    case Stage.name   : return new Stage(obj as (UIAttr & { children : any[] }))
    case Grid.name    : return new Grid(obj  as (UIAttr & { children : any[], columns?: string, rows? : string }));
    case TreeNode.name: return new TreeNode(obj as (UIAttr & { icon?: string, label: string, childNodes : any[] }));
    case ScrollView.name: return new ScrollView(obj as (UIAttr & { viewChildren : any[], viewSize:[number, number] }));
    case Graph.name   : return new Graph(obj  as (UIAttr & { children : any[] }));

    }

    throw new MyError();
}

export function getNearUIinArray(children : UI[], position : Vec2){
    for(const child of children){
        const ui = child.getNearUI(position);
        if(ui !== undefined){
            return ui;
        }
    }

    return undefined;
}

}