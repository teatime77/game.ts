///<reference path="../../widget/grid.ts" />
///<reference path="../../widget/text.ts" />

namespace game_ts {
//

export class ColumnArithmetic extends ContainerUI {
    expr : App;
    nums : NumberUI[];
    operator : Label;

    expandNumberIdx : number = NaN;
    progress : number = NaN;
    heightDiff : number = NaN;

    constructor(data : UIAttr, app : App){
        super(data);

        this.expr = app;
        assert(this.expr.args.every(x => x instanceof ConstNum));

        this.nums = this.expr.args.map(arg => new NumberUI(arg.value.int()));
        this.operator = makeOperatorLabel(this.expr.fncName);

        this.addChildren(...this.nums, this.operator);

        setTimeout(()=>{
            this.expandNumber(0);
        }, 3000);
    }

    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());
        this.setMinSizeByChildren();
    }

    setMinSizeByChildren() : void {
        const padding_border_size = this.getPaddingBorderSize();

        const width  = this.operator.size.x + Math.max(...this.nums.map(x => x.size.x));
        const height = Math.max(...this.nums.map(x => x.position.y + x.size.y));

        this.minSize.x = width  + padding_border_size.x;
        this.minSize.y = height + padding_border_size.y;

        this.size.copyFrom(this.minSize);
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        let y = 0;
        const content_size = this.getContentSize();
        for(const [row, num] of this.nums.entries()){
            const x = content_size.x - num.size.x;

            num.setPosition(Vec2.fromXY(x, y));

            if(row == this.nums.length - 1){

                this.operator.setPosition(Vec2.fromXY(0, y));
                break;
            }

            if(!isNaN(this.progress) && this.expandNumberIdx == row){
                y += this.heightDiff * this.progress;
                // msg(`diff y ${row} diff:${this.heightDiff} prog:${this.progress}`)
            }
            else{
                y += num.size.y;
            }
        }

        this.children.forEach(x => x.updateLayout());

        this.setMinSizeByChildren();
    }

    expandNumber(idx : number){
        msg("expand Number")
        this.expandNumberIdx = idx;

        const num = this.nums[idx];
        const nums = num.splitPlaceValues();        

        this.nums.splice(idx, 1, ...nums);

        this.children = [];
        this.addChildren(...this.nums, this.operator);

        nums.forEach(x => x.setMinSize());
        this.heightDiff = sum(nums.map(x => x.size.y)) - num.size.y;
        this.progress = 0;
        const id = setInterval(()=>{
            this.progress += 0.05;
            if(this.progress < 1){
                this.setMinSize();
                this.updateLayout();
                Canvas.requestUpdateCanvas();
            }
            else{
                this.progress = NaN;
                clearInterval(id);
            }
        }, 50);

        updateRoot(this);
    }
}

}