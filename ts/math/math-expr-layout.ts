///<reference path="../widget/grid.ts" />

namespace game_ts {
//
export class MathExprLayout extends Grid {
}

export function makeMathExprLayout(expr : Term) : UI {
    if(expr instanceof ConstNum){
        return new Digit(expr);
    }
    else if(expr instanceof App){
        assert(expr.args.length == 2);
        const argUis = expr.args.map(x => makeMathExprLayout(x));
        const operator = makeOperatorLabel(expr.fncName);
        return new MathExprLayout(Grid.singleRow({}, argUis[0], operator, argUis[1]));
    }
    else{
        throw new MyError();
    }
}

}