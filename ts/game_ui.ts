namespace game_ts {
//
const textColor = "black";

export interface UIAttr {
    className : string;
    name? : string;
    position? : [number, number];
    size?     : [number, number];
    borderStyle? : string;
    backgroundColor? : string;
    imageFile? : string;

    colSpan? : number;
    rowSpan? : number;
}

export interface TextUIAttr extends UIAttr {
    text? : string;
    fontSize? : string;
    textAlign? : string;
}

export abstract class UI {
    static count : number = 0;

    idx      : number;
    parent?  : Block;
    position : Vec2 = Vec2.zero();
    size     : Vec2 = Vec2.zero();
    minSize  : Vec2;
    backgroundColor? : string;
    color?           : string;
    borderWidth : number = 5;

    colIdx! : number;
    rowIdx! : number;

    colSpan? : number;
    rowSpan? : number;

    getColSpan() : number {
        return this.colSpan == undefined ? 1 : this.colSpan;
    }

    getRowSpan() : number {
        return this.rowSpan == undefined ? 1 : this.rowSpan;
    }

    clickHandler? : ()=>Promise<void>;

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        this.drawBorder(ctx, offset);
    }

    str() : string {
        return `${this.idx} ${this.constructor.name}`;
    }

    constructor(data : UIAttr){
        this.idx      = UI.count++;

        if(data.position != undefined){
            this.position = new Vec2(data.position[0], data.position[1]);
        }

        if(data.size != undefined){
            this.size     = new Vec2(data.size[0], data.size[1]);
        }
        this.minSize = this.size.copy();

        if(data.colSpan != undefined){
            this.colSpan = data.colSpan;
        }

        if(data.rowSpan != undefined){
            this.rowSpan = data.rowSpan;
        }

        this.backgroundColor = data.backgroundColor;
    }

    absPosition() : Vec2 {
        let ui : UI = this;
        let pos = this.position;
        while(ui.parent != undefined){
            ui = ui.parent;
            pos = pos.add(ui.position);
        }

        return pos;
    }

    setPosition(position : Vec2) {
        this.position.copyFrom(position);
    }

    setMinSize() : void {
    }

    layout(position : Vec2, size : Vec2) : void {
        this.position.copyFrom(position);
        this.size.copyFrom(size);
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
        if(this.clickHandler != undefined){
            await this.clickHandler();
        }
    }

    drawBorder(ctx : CanvasRenderingContext2D, offset : Vec2) {
        const x1 = offset.x + this.position.x;
        const y1 = offset.y + this.position.y;
        const width  = this.size.x;
        const height = this.size.y;
        const ridgeWidth = this.borderWidth;

        const x2 = x1 + ridgeWidth / 2;
        const y2 = y1 + ridgeWidth / 2;

        const x3 = x1 + ridgeWidth;
        const y3 = y1 + ridgeWidth;

        const x4 = x1 + width  - ridgeWidth;
        const y4 = y1 + height - ridgeWidth;

        const x5 = x1 + width  - ridgeWidth / 2;
        const y5 = y1 + height - ridgeWidth / 2;

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
        ctx.fillRect(x3, y3, width - 2 * ridgeWidth, height - 2 * ridgeWidth);

        // Draw the "light" sides (top and left)
        ctx.strokeStyle = lightColor;
        ctx.lineWidth = ridgeWidth;
        ctx.beginPath();
        ctx.moveTo(x2, y1 + height - ridgeWidth / 2); // Bottom-left corner
        ctx.lineTo(x2, y2);     // Top-left corner
        ctx.lineTo(x1 + width - ridgeWidth / 2, y2); // Top-right corner
        ctx.stroke();

        // Draw the "dark" sides (bottom and right)
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = ridgeWidth;
        ctx.beginPath();
        ctx.moveTo(x1 + width - ridgeWidth / 2, y2);     // Top-right corner
        ctx.lineTo(x1 + width - ridgeWidth / 2, y1 + height - ridgeWidth / 2); // Bottom-right corner
        ctx.lineTo(x2, y1 + height - ridgeWidth / 2); // Bottom-left corner
        ctx.stroke();
    }
}

export class TextUI extends UI {
    fontSize? : string;
    textAlign? : string;
    text : string;
    metrics!: TextMetrics;
    actualHeight!: number;

    constructor(data : TextUIAttr){
        super(data);
        // this.fontSize  = data.fontSize;
        // this.textAlign = data.textAlign;
        this.text = (data.text != undefined ? data.text : "");
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        super.draw(ctx, offset);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${(this.size.y * 0.8).toFixed()}px "Hiragino Kaku Gothic Pro", "Meiryo", sans-serif`;

        const x = offset.x + this.position.x + this.size.x / 2;
        const y = offset.y + this.position.y + this.size.y / 2;

        ctx.fillStyle = textColor;
        ctx.fillText(this.text, x, y);
    }
}

export class Label extends TextUI {
}

export class Button extends TextUI {
}

export function isTransparent(ctx : CanvasRenderingContext2D, position : Vec2) {
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

export class Block extends UI {
    children : UI[] = [];

    constructor(data : UIAttr & { children : UI[] }){
        super(data);
        this.children = data.children.slice();
        this.children.forEach(x => x.parent = this);
    }

    getNearUI(position : Vec2) : UI | undefined {
        const position2 = position.sub(this.position);

        for(const child of this.children){
            const ui = child.getNearUI(position2);
            if(ui != undefined){
                return ui;
            }
        }

        if(this.isNear(position)){
            return this;
        }

        return undefined;
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        super.draw(ctx, offset);
        const offset2 = offset.add(this.position);
        this.children.forEach(x => x.draw(ctx, offset2));
    }
}

export class Grid extends Block {
    columns : string[];
    rows    : string[];
    numCols : number;
    numRows : number;

    constructor(data : UIAttr & { children : UI[], columns?: string, rows? : string }) {
        super(data);
        if(data.columns != undefined){

            this.columns = data.columns.split(" ");

            this.numCols = this.columns.length;
        }
        else{
            this.columns = ["100%"];
            this.numCols = 1;
        }

        this.setRowColIdxOfChildren();

        if(data.rows != undefined){

            this.rows = data.rows.split(" ");
            this.numRows = this.rows.length;
        }
        else{
            this.numRows = Math.max(... this.children.map(x => x.rowIdx + x.getRowSpan()));
            this.rows    = new Array(this.numRows).fill("100%");
        }
    }

    static pix(s : string) : number {
        assert(s.endsWith("px"));
        return parseFloat(s.slice(0, -2));
    }

    static ratio(s: string) : number {
        assert(s.endsWith("%"));
        return parseFloat(s.slice(0, -1)) / 100;
    }

    static pixSum(pixes : string[]) : number {
        const pix_nums = pixes.map(x => Grid.pix(x));
        return i18n_ts.sum(pix_nums);
    }

    static ratioSum(ratioes : string[]) : number {
        const pix_nums = ratioes.map(x => Grid.ratio(x));
        return i18n_ts.sum(pix_nums);
    }

    static minTotalSize(columns : string[], min_size : number) : number {
        const ratio_columns = columns.filter(x => x.endsWith("%"));
        if(ratio_columns.length == 0){
            return 0;
        }

        const pix_columns = columns.filter(x => x.endsWith("px"));

        const ratio_sum = Grid.ratioSum(ratio_columns);

        const pix_sum = Grid.pixSum(pix_columns);

        const ratio_pix = min_size - pix_sum;
        assert(0 < ratio_pix);

        // grid-width * ratio_sum = ratio_pix
        return ratio_pix / ratio_sum;
    }

    setRowColIdxOfChildren(){
        let col_idx = 0;
        let row_idx = 0;
        for(const child of this.children){
            child.colIdx = col_idx;
            child.rowIdx = row_idx;

            col_idx += child.getColSpan();
            if(this.numCols <= col_idx){
                col_idx = 0;
                row_idx++;
            }
        }
    }

    setMinSize() : void {
        assert(!isNaN(this.numCols) && !isNaN(this.numRows));

        this.children.forEach(x => x.setMinSize());

        let max_grid_ratio_width  = 0;
        let max_grid_ratio_height = 0;

        for(const child of this.children){
            const columns = this.columns.slice(child.colIdx, child.colIdx + child.getColSpan());
            max_grid_ratio_width = Math.max(max_grid_ratio_width, Grid.minTotalSize(columns, child.minSize.x));

            const rows = this.rows.slice(child.rowIdx, child.rowIdx + child.getRowSpan());
            max_grid_ratio_height = Math.max(max_grid_ratio_height, Grid.minTotalSize(rows, child.minSize.y));
        }

        const grid_pix_width  = Grid.pixSum( this.columns.filter(x => x.endsWith("px")) );
        const grid_pix_height = Grid.pixSum( this.rows.filter(x => x.endsWith("px")) );

        this.minSize.x = grid_pix_width  + max_grid_ratio_width;
        this.minSize.y = grid_pix_height + max_grid_ratio_height;

        this.size.copyFrom(this.minSize);
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        const column_pix = this.columns.map(x => (x.endsWith("px") ? Grid.pix(x) : Grid.ratio(x) * this.size.x )  );
        const row_pix    = this.rows.map(x => (x.endsWith("px") ? Grid.pix(x) : Grid.ratio(x) * this.size.y )  );

        const column_pos : number[] = [0];
        column_pix.forEach(x => column_pos.push( last(column_pos) + x ));

        const row_pos : number[] = [0];
        row_pix.forEach(x => row_pos.push( last(row_pos) + x ));


        for(const child of this.children){
            const x = column_pos[child.colIdx];
            const y = row_pos[child.rowIdx];

            const width  = sum(column_pix.slice(child.colIdx, child.colIdx + child.getColSpan()));
            const height = sum(row_pix.slice(child.rowIdx, child.rowIdx + child.getRowSpan()));

            child.layout(new Vec2(x, y), new Vec2(width, height));
        }
    }
}


export class Star extends UI {
    velocity : Vec2 = Vec2.zero();

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        ctx.fillStyle = (this.backgroundColor != undefined ? this.backgroundColor : "yellow");

        ctx.beginPath();

        const radius1 = 30;
        const radius2 = 10;
        for(const idx of range(10)){
            const theta = Math.PI / 2 + 2 * Math.PI * idx / 10;

            const radius = (idx % 2 == 0 ? radius1 : radius2);
            // msg(`${idx} ${(180 * theta / Math.PI).to}`)

            const x = offset.x + this.position.x + radius * Math.cos(theta);
            const y = offset.y + this.position.y + radius * Math.sin(theta);
            
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
}

export class Firework extends UI {
    stars: Star[];

    constructor(data : UIAttr & { numStars: number}) {
        super(data);
        const colors = [
            "#FF0000", "#00FF00", "#0000FF", 
            "#FFFF00", "#00FFFF", "#FF00FF", 
        ];

        this.stars = [];
        for(const _ of range(data.numStars)){
            
            const star = new Star({
                "position" : [this.position.x, this.position.y],
                "backgroundColor" : colors[Math.floor(6.0 * Math.random())]
            } as UIAttr);

            const vx = 3.0 * (Math.random() - 0.5);
            const vy = 3.0 * (Math.random() - 0.5);
            star.velocity = new Vec2(vx, vy);

            this.stars.push(star);
        }
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        for(const star of this.stars){
            star.draw(ctx, offset);
            star.position = star.position.add(star.velocity);
        }

        Canvas.one.requestUpdateCanvas();
    }
}
}