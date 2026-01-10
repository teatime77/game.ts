///<reference path="../../widget/grid.ts" />
///<reference path="../../widget/text.ts" />

namespace game_ts {
//
export const digitSize = 60;

function getDigitCount(n: number): number {
    assert(0 <= n && Math.floor(n) == n);
    return n.toString().length;
}

function splitDigits(n: number): number[] {
     return n.toString().split('').map(Number);
}

export function toInt(term : Term) : number {
    if(term instanceof parser_ts.ConstNum){
        return term.value.int();
    }
    throw new MyError();
}

function toExpandedForm(n: number): number[] {
    const s = n.toString();
    return s.split('')
        .map((digit, i) => Number(digit) * Math.pow(10, s.length - i - 1))
        .filter(val => val !== 0); // 0の位を除去
}

const entries: [string, string][] = [
    [ "+", "＋" ],
    [ "-", "－" ],
    [ "*", "×" ],
    [ "/", "÷" ]
];

const myMap = new Map<string, string>(entries);

export function arithmeticOperator(operator : string){
    const ret = myMap.get(operator);
    return ret == undefined ? operator : ret;
}

export function makeOperatorLabel(operator : string) : Label {
    return new Label({text : arithmeticOperator(operator), size : [digitSize, digitSize] });
}

export class Digit extends Label {
    constructor(value  : number){
        const data : TextUIAttr = {
            text : `${value}`,
            size : [digitSize, digitSize]
            // padding : 0,
            // borderWidth : 0
        };
        super(data);
    }
}

export class NumberUI extends Grid {
    value  : number;
    digits : Digit[];

    constructor(value  : number){
        const nums = splitDigits(value);
        
        const grid_data : GridAttr ={
            columns  : Grid.autoSize(nums.length),
            rows     : "*"
        };

        super(grid_data);

        this.value = value;
        this.digits = nums.map(n => new Digit(n));
        this.addChildren(...this.digits);
        this.setRowColIdxOfChildren();        
    }

    splitPlaceValues() : NumberUI[] {
        const values = toExpandedForm(this.value);
        const nums = values.map(n => new NumberUI(n));

        return nums;
    }
}

export class ArithmeticView extends Grid {
    constructor(data : GridAttr & {expr : string}){
        data.columns = "* *";
        data.rows    = "*";
        super(data);

        makeArithmeticView(this, data);
        this.setRowColIdxOfChildren();
    }
}

export function makeArithmeticView(parent_grid : Grid, data : UIAttr & { expr : string }){
    const app = parseMath(data.expr, true) as App;

    const image_view = makeImageViewFromApp(app);
    const column_arithmetic = new ColumnArithmetic(data, app);

    parent_grid.addChildren(image_view, column_arithmetic);
}


export abstract class BasicArithmetic extends Grid {

}

export class SingleDigitArithmetic extends BasicArithmetic {    
}

/*
abstract class ArithmeticTerm {
}

abstract class ArithmeticExpression extends ArithmeticTerm {
    args : number[] = [];
}

class AdditionExpression extends ArithmeticExpression {
    readonly symbol = '+';
}

class SubtractionExpression extends ArithmeticExpression {
    readonly symbol = '-';
}

class MultiplicationExpression extends ArithmeticExpression {
    readonly symbol = '×';
}

class DivisionExpression extends ArithmeticExpression {
    readonly symbol = '÷';
}
*/

}