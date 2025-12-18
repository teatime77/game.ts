///<reference path="core.ts" />

namespace game_ts {
//
const imageMap = new Map<string, HTMLImageElement>();

export class ImageUI extends UI {
    imageFile : string;

    constructor(data : UIAttr){
        super(data);
        this.imageFile = data.imageFile!;
        addImage(this.imageFile);
    }

    isNear(position : Vec2) : boolean {
        if(this.position.x <= position.x && position.x < this.position.x + this.size.x){
            if(this.position.y <= position.y && position.y < this.position.y + this.size.y){
                return true;
            }
        }

        return false;
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        super.draw(ctx, offset);
        const image = imageMap.get(this.imageFile);
        if(image == undefined){
            // msg(`no img:${this.imageFile}`);
        } 
        else{
            const content_position    = this.getContentPosition();
            const padding_border_size = this.getPaddingBorderSize();

            const x = offset.x + this.position.x + content_position.x;
            const y = offset.y + this.position.y + content_position.y;
            const width = this.size.x - padding_border_size.x;
            const height = this.size.y - padding_border_size.y;
            ctx.drawImage(image, x, y, width, height);
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