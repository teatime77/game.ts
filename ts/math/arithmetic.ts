///<reference path="../widget/grid.ts" />
///<reference path="../widget/text.ts" />

namespace game_ts {
//
const digitSize = 60;
const gap = 10;

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

export class ImageGrid10 extends ContainerUI {
    cellSize : Vec2 = Vec2.fromXY(30, 30);
    value : number = 10;
    images : ImageUI[];

    constructor(data : UIAttr & { value? : number } ){
        super(data);

        if(data.value != undefined){
            this.value = data.value;
        }
        const imageFile = (data.imageFile != undefined ? data.imageFile : "banana.png");
        this.images = range(this.value).map(x => new ImageUI({ imageFile, size : [ this.cellSize.x, this.cellSize.y ], borderWidth:0, padding : 0}));
        this.addChildren(...this.images);
    }

    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());

        const width  = 5 * this.cellSize.x;
        const height = 2 * this.cellSize.y;

        this.setMinSizeFromContentSize(width, height);
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        let x : number;
        let y : number;
        for(const [idx, image] of this.images.entries()){
            if(idx <= 4){
                x = idx * this.cellSize.x;
                y = 0;
            }
            else{

                x = (idx - 5) * this.cellSize.x;
                y = this.cellSize.y;
            }

            image.layoutXY(x, y);
        }
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

    splitPlaceValues() : NumberUI[] {
        const values = toExpandedForm(this.value);
        const nums = values.map(n => new NumberUI(n));

        return nums;
    }
}

export class ColumnArithmetic extends ContainerUI {
    expr : App;
    nums : NumberUI[];
    operator : Label;

    expandNumberIdx : number = NaN;
    progress : number = NaN;
    heightDiff : number = NaN;

    constructor(data : UIAttr & { expr : string }){
        super(data);

        parser_ts.setArithmetic(true);
        const app = parseMath(data.expr) as App;
        assert(app.args.every(x => x instanceof ConstNum));
        this.expr = app;

        this.nums = app.args.map(arg => new NumberUI(arg.value.int()));
        this.operator = new Label({text : arithmeticOperator(app.fncName), size : [digitSize, digitSize] });

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

export class TenBundleView extends ContainerUI {
    value  : number;
    tens : ImageGrid10[] = [];
    unit : ImageGrid10 | undefined;

    constructor(data : UIAttr & { value : number }){
        super(data);

        this.value = data.value;

        const unit_count = this.value % 10;
        const tens_count = (this.value - unit_count) / 10;

        if(tens_count != 0){
            this.tens = range(tens_count).map(x => new ImageGrid10({}));
            this.addChildren(...this.tens);
        }

        if(unit_count != 0){
            this.unit = new ImageGrid10({value : unit_count});
            this.addChildren(this.unit);
        }
    }


    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());

        let width  : number = 0;
        let height : number = 0;

        if(this.children.length != 0){

            if(this.tens.length != 0){
                width = this.tens[0].size.x;
                height = this.tens.length * this.tens[0].size.y;
            }
        }

        if(this.unit != undefined){
            if(this.tens.length != 0){
                width += gap;
            }

            width += this.unit.size.x;
            height = Math.max(height, this.unit.size.y);
        }

        this.setMinSizeFromContentSize(width, height);
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        for(const [idx, ten] of this.tens.entries()){
            ten.setPosition(Vec2.fromXY(0, idx * this.tens[0].size.y));
        }

        if(this.unit != undefined){

            const content_size = this.getContentSize();
            const x = (this.tens.length == 0 ? 0 : this.tens[0].size.x + gap);

            this.unit.setPosition(Vec2.fromXY(x, content_size.y - this.unit.size.y));
        }

        this.children.forEach(x => x.updateLayout());
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