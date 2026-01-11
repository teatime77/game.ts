///<reference path="../widget/container.ts" />

namespace game_ts {
//

export function makeMathExprLayout(expr : Term) : UI {
    if(expr instanceof ConstNum){
        return new Digit(expr.value.int());
    }
    else if(expr instanceof App){
        assert(expr.args.length == 2);
        const argUis = expr.args.map(x => makeMathExprLayout(x));
        const operator = makeOperatorLabel(expr.fncName);
        return Grid.singleRow({}, argUis[0], operator, argUis[1]);
    }
    else{
        throw new MyError();
    }
}

}