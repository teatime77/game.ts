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

    removeChild(child : UI){
        remove(this.children, child);
    }

    addChildren(...children : UI[]){
        this.children.push(...children);
        children.forEach(x => x.parent = this);
    }

    spliceChildren(idx : number, ...children : UI[]){
        this.children.splice(idx, 1, ...children);
        children.forEach(x => x.parent = this);
    }

    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());
    }

    setMinSizeByChildren() : void {
        const padding_border_size = this.getPaddingBorderSize();

        const width  = Math.max(...this.children.map(x => x.right()));
        const height = Math.max(...this.children.map(x => x.bottom()));

        this.minSize.x = width  + padding_border_size.x;
        this.minSize.y = height + padding_border_size.y;

        this.size.copyFrom(this.minSize);
        if(this instanceof MathExprLayout){
            msg(`B:${this.idx} width:${width} size x:${this.size.x}`)
        }
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