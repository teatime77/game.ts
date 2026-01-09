///<reference path="../widget/grid.ts" />
///<reference path="../widget/text.ts" />

namespace game_ts {
//
const digitSize = 60;

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

function arithmeticOperator(operator : string){
    const ret = myMap.get(operator);
    return ret == undefined ? operator : ret;
}

export class SingleDigitImage extends Grid {
    value : number;
    images : ImageUI[];
    labels : Label[] = [];

    constructor(data : { value : number }){
        const grid_data : GridAttr = Object.assign(
            {
                columns  : Grid.autoSize(data.value),
                rows     : "* *"
            }
            , 
            data
        );

        super(grid_data);

        this.images = range(data.value).map(x => new ImageUI({ imageFile : "banana.png", size : [ 60, 60 ]}));
        this.labels = range(data.value).map(i => new Label({ text : `${i + 1}`, size : [ 60, 60 ]}));

        this.addChildren(...this.images);
        this.addChildren(...this.labels);


        this.setRowColIdxOfChildren();

        this.value = data.value;
    }
}

export class ImageGrid10 extends Grid {
    images : ImageUI[];

    constructor(data : UIAttr){
        const grid_data : GridAttr = Object.assign(
            {
                columns  : "* * * * *",
                rows     : "* *"
            }
            , 
            data
        );

        super(grid_data);
        const imageFile = (data.imageFile != undefined ? data.imageFile : "banana.png");
        this.images = range(10).map(x => new ImageUI({ imageFile, size : [ 20, 20 ], borderWidth:0, padding : 0}));
        this.addChildren(...this.images);

        this.setRowColIdxOfChildren();
    }
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
}

export class ColumnArithmetic extends ContainerUI {
    expr : App;
    nums : NumberUI[];
    operator : Label;

    constructor(data : UIAttr & { expr : string }){
        super(data);

        parser_ts.setArithmetic(true);
        const app = parseMath(data.expr) as App;
        assert(app.args.every(x => x instanceof ConstNum));
        this.expr = app;

        this.nums = app.args.map(arg => new NumberUI(arg.value.int()));
        this.operator = new Label({text : arithmeticOperator(app.fncName), size : [digitSize, digitSize] });

        this.addChildren(...this.nums, this.operator);
    }

    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());

        const padding_border_size = this.getPaddingBorderSize();

        const width  = this.operator.size.x + Math.max(...this.nums.map(x => x.size.x));
        const height = sum(this.nums.map(x => x.size.y));

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

            y += num.size.y;
        }

        this.children.forEach(x => x.updateLayout());
    }

    splitPlaceValues(idx : number){
        const num = this.nums[idx];

    }
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