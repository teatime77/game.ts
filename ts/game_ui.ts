namespace game_ts {
//
const textColor = "black";
const imageMap = new Map<string, HTMLImageElement>();

export interface UIAttr {
    className : string;
    name? : string;
    position : [number, number];
    size     : [number, number];
    backgroundColor? : string;
    imageFile? : string;
}

export interface TextUIAttr extends UIAttr {
    text? : string;
    fontSize? : string;
    textAlign? : string;
}

export abstract class UI {
    static count : number = 0;

    idx      : number;
    position : Vec2 = Vec2.zero();
    size     : Vec2 = Vec2.zero();
    backgroundColor? : string;
    borderWidth : number = 3;

    clickHandler? : ()=>Promise<void>;

    draw(ctx : CanvasRenderingContext2D) : void {
        this.drawBorder(ctx);
    }

    str() : string {
        return `${this.idx} ${this.constructor.name}`;
    }

    constructor(data : UIAttr){
        this.idx      = UI.count++;
        this.position = new Vec2(data.position[0], data.position[1]);
        this.size     = new Vec2(data.size[0], data.size[1]);
    }

    async click(){
        if(this.clickHandler != undefined){
            await this.clickHandler();
        }
    }

    drawBorder(ctx : CanvasRenderingContext2D) {
        const x = this.position.x;
        const y = this.position.y;
        const width  = this.size.x;
        const height = this.size.y;
        const ridgeWidth = this.borderWidth;
        // const x : number, y : number, width : number, height : number, ridgeWidth : number
        // Define light and dark colors
        // const lightColor = isInset ? '#888' : '#eee'; // Darker for inset top/left
        // const darkColor = isInset ? '#eee' : '#888';  // Lighter for inset bottom/right

        const lightColor = "#ffffff";
        const darkColor = "#888888";
        const backgroundColor = (this.backgroundColor != undefined ? this.backgroundColor : "#cccccc");

        // Optionally, draw the inner rectangle (fill or another stroke)
        ctx.fillStyle = backgroundColor; // Example inner color
        ctx.fillRect(x + ridgeWidth, y + ridgeWidth, width - 2 * ridgeWidth, height - 2 * ridgeWidth);

        // Draw the "light" sides (top and left)
        ctx.strokeStyle = lightColor;
        ctx.lineWidth = ridgeWidth;
        ctx.beginPath();
        ctx.moveTo(x + ridgeWidth / 2, y + height - ridgeWidth / 2); // Bottom-left corner
        ctx.lineTo(x + ridgeWidth / 2, y + ridgeWidth / 2);     // Top-left corner
        ctx.lineTo(x + width - ridgeWidth / 2, y + ridgeWidth / 2); // Top-right corner
        ctx.stroke();

        // Draw the "dark" sides (bottom and right)
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = ridgeWidth;
        ctx.beginPath();
        ctx.moveTo(x + width - ridgeWidth / 2, y + ridgeWidth / 2);     // Top-right corner
        ctx.lineTo(x + width - ridgeWidth / 2, y + height - ridgeWidth / 2); // Bottom-right corner
        ctx.lineTo(x + ridgeWidth / 2, y + height - ridgeWidth / 2); // Bottom-left corner
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

    draw(ctx : CanvasRenderingContext2D) : void {
        super.draw(ctx);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${(this.size.y * 0.8).toFixed()}px "Hiragino Kaku Gothic Pro", "Meiryo", sans-serif`;

        const x = this.position.x + this.size.x / 2;
        const y = this.position.y + this.size.y / 2;

        ctx.fillStyle = textColor;
        ctx.fillText(this.text, x, y);
    }
}

export class Label extends TextUI {
}

export class Button extends TextUI {
}

export class ImageUI extends UI {
    imageFile : string;

    constructor(data : UIAttr){
        super(data);
        this.imageFile = data.imageFile!;
        addImage(this.imageFile);
    }

    draw(ctx : CanvasRenderingContext2D) : void {
        const image = imageMap.get(this.imageFile);
        if(image != undefined){
            ctx.drawImage(image, this.position.x, this.position.y, this.size.x, this.size.y);
        }
    }
}

function addImage(image_file : string){
    if(imageMap.has(image_file)){
        return;
    }

    const image = new Image();
    // Set the path to your image file
    image.src = `img/${image_file}`;    
    image.onload = ()=>{
        imageMap.set(image_file, image);
        Canvas.one.requestUpdateCanvas();
        msg(`image loaded:${image_file}`);
    }
}
}