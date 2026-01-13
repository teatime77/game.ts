///<reference path="../widget/grid.ts" />

namespace game_ts {
//
export class MathExprLayout extends ContainerUI {
    app : App;
    expandNumberIdx : number = NaN;
    progress : number = NaN;
    widthDiff : number = NaN;

    constructor(data : UIAttr & { children : UI[] }, app : App){
        super(data);
        this.app = app;
    }

    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());
        this.layoutChildren();
        this.setMinSizeByChildren();
    }

    layoutChildren(){
        let x = 0;
        for(const [idx, child] of this.children.entries()){

            child.setPosition(Vec2.fromXY(x, 0));
            msg(`child right: ${child.right()}`);

            if(!isNaN(this.progress) && this.expandNumberIdx == idx){
                x += this.widthDiff * this.progress;
            }
            else{
                x += child.size.x;
            }
        }
        const width  = Math.max(...this.children.map(x => x.right()));
        msg(`A:${this.idx} width:${width} size x:${this.size.x}`)

        this.children.forEach(x => x.updateLayout());
    }

    expandDigit(digit : Digit, progress : number){
        if(progress == 0){

            this.expandNumberIdx = this.children.indexOf(digit);
            assert(this.expandNumberIdx != -1);

            const child_digits = digit.splitDigitPlaceValues();     
            
            const expr = child_digits.flatMap((x, i) => i == 0 ? [x] : [makeOperatorLabel(this.app.fncName), x]);

            this.spliceChildren(this.expandNumberIdx, ...expr);

            expr.forEach(x => x.setMinSize());
            // this.widthDiff = sum(expr.map(x => x.size.x)) - digit.size.x;
            this.widthDiff = digit.size.x;
        }
        else if(1 < progress){

            this.progress = NaN;
            updateRoot(this);
            return;
        }

        this.progress = progress;

        this.setMinSize();
        this.updateLayout();
        Canvas.requestUpdateCanvas();
    }
}

export function makeMathExprLayout(expr : Term) : UI {
    if(expr instanceof ConstNum){
        return new Digit(expr);
    }
    else if(expr instanceof App){
        assert(expr.args.length == 2);
        const argUis = expr.args.map(x => makeMathExprLayout(x));
        const operator = makeOperatorLabel(expr.fncName);
        return new MathExprLayout({ children : [argUis[0], operator, argUis[1]]}, expr);
    }
    else{
        throw new MyError();
    }
}

}