///<reference path="core.ts" />

namespace game_ts {
//
export abstract class ContainerUI extends UI {
    children : UI[] = [];

    constructor(data : UIAttr & { children? : any[] }){
        super(data);

        if(data.children != undefined){
            this.children = (data.children as any[]).map(x => makeUIFromObj(x));
            this.children.forEach(x => x.parent = this);
        }
    }

    addChildren(...children : UI[]){
        this.children.push(...children);
        children.forEach(x => x.parent = this);
    }

    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());
    }

    getNearUI(position : Vec2) : UI | undefined {
        if(this.isNear(position)){
            const content_position = this.getContentPosition();
            const position2 = position.sub(this.position).sub(content_position);

            const ui = getNearUIinArray(this.children.slice().reverse(), position2);
            if(ui !== undefined){
                return ui;
            }

            return this;
        }

        return undefined;
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2, visibleArea : VisibleArea | undefined) : void {
        super.draw(ctx, offset, visibleArea);

        const content_position = this.getContentPosition();
        const offset2 = offset.add(this.position).add(content_position);
        if(isNaN(offset2.x)){
            throw new MyError();
        }

        if(this instanceof ScrollView){
            this.drawScrollView(ctx, offset2, visibleArea);
        }
        else{
            this.children.forEach(x => x.draw(ctx, offset2, visibleArea));
        }
    }
}

}