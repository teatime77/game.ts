namespace game_ts {
//
const textColor = "white";

interface TextDimensions {
    width: number;
    height: number;
    // Optional: for precise positioning
    actualLeft: number;
    actualTop: number;
}

export function getTextBoxSize(ctx: CanvasRenderingContext2D, text: string, font: string): TextDimensions {
    // 1. Set the font so measureText() can calculate based on it
    ctx.font = font;

    // 2. Get the TextMetrics object
    const metrics = ctx.measureText(text);

    // 3. Calculate Width
    // metrics.width is the advance width (how far the cursor moves after drawing)
    const textWidth = metrics.width;
    
    // OR, for the absolute visible width (handling overhanging italic characters):
    // const actualWidth = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);

    // 4. Calculate Height (The recommended way for the tight bounding box)
    // actualBoundingBoxAscent is the distance from the baseline to the top of the text.
    // actualBoundingBoxDescent is the distance from the baseline to the bottom of the text.
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    return {
        width: textWidth, 
        height: textHeight,
        // The distance from the (x, y) point to the top-left of the text's bounding box.
        actualLeft: metrics.actualBoundingBoxLeft,
        actualTop: metrics.actualBoundingBoxAscent 
    };
}

export class TextUI extends UI {
    fontFamily? : string;
    fontSize? : string;
    textAlign? : string;
    text : string;
    metrics!: TextMetrics;
    actualHeight!: number;

    constructor(data : TextUIAttr){
        super(data);
        if(data.fontFamily !== undefined){
            this.fontFamily = data.fontFamily;
        }
        if(data.fontSize !== undefined){
            this.fontSize = data.fontSize;
        }
        // this.textAlign = data.textAlign;
        this.text = (data.text != undefined ? data.text : "");
    }

    getFont() : string {
        const fontFamily = (this.fontFamily != undefined ? this.fontFamily : Canvas.fontFamily);
        const fontSize   = (this.fontSize   != undefined ? this.fontSize   : Canvas.fontSize);
        
        return `${fontSize} ${fontFamily}`;
    }

    setMinSize() : void {
        if(this.fixedSize !== undefined){

            this.minSize.copyFrom(this.fixedSize);
        }
        else{

            const padding_border_size = this.getPaddingBorderSize();

            const canvas = getCanvasFromUI(this);
            const size = getTextBoxSize(canvas.ctx, this.text, this.getFont());

            this.minSize.x = size.width  + padding_border_size.x;
            this.minSize.y = size.height + padding_border_size.y;
        }

        this.size.copyFrom(this.minSize);
        // msg(`text size:${this.size.x.toFixed()} ${this.size.y.toFixed()} ${this.text}`);
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        super.draw(ctx, offset);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // ctx.font = `${(this.size.y * 0.8).toFixed()}px "Hiragino Kaku Gothic Pro", "Meiryo", sans-serif`;
        ctx.font = this.getFont();
        
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
}