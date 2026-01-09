namespace game_ts {
//
type PrimitiveValueType = Term | boolean | number | UI | RuntimeFunction;
type ValueType = PrimitiveValueType | ValueType[];

export function makeTermFromObj(obj : any) : Term {
    throw new MyError();
}

export function makeTermFromObjs(... objs : any[]) : Term[] {
    throw objs.map(x => makeTermFromObj(x));
}



export abstract class RuntimeFunction {
    // parameters : Term[];

    // constructor(data : { parameters : any[]}){
    //     this.parameters = data.parameters.map(x => makeTermFromObj(x));
    // }
    constructor(data : any){        
    }

    abstract eval() : ValueType;
    apply(... args:ValueType[]) : ValueType {
        throw new MyError();
    }
}

export class randomInt extends RuntimeFunction {
    min : Term;
    max : Term;

    constructor(data : { min : any, max : any }){
        super(data);
        [this.min, this.max] = makeTermFromObjs(data.min, data.max);
    }

    eval() : ValueType {
        const min = toInt(this.min);
        const max = toInt(this.max);

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

export class Range extends RuntimeFunction {
    min : Term;
    max : Term;

    constructor(data : { min : any, max : any }){
        super(data);
        [this.min, this.max] = makeTermFromObjs(data.min, data.max);
    }

    eval() : ValueType {
        const min = toInt(this.min);
        const max = toInt(this.max);

        return range2(min, max + 1);
    }
}

export class ViewFactory {
    constructor(data : any){        
    }
}

export class LabelFactory extends ViewFactory {
    text : string;

    constructor(data : { text : number | string}){
        super(data);
        if(typeof data.text == "number"){
            this.text = data.text.toString();
        }
        else{
            this.text = data.text
        }
    }

    eval() : ValueType {
        return new Label({ text : this.text} as UIAttr);
    }
}

export class MapFunction extends RuntimeFunction {
    list     : ValueType[];
    function : RuntimeFunction;

    constructor(data: { list:any[], function : RuntimeFunction}){
        super(data);
        this.list     = data.list.map(x => makeTermFromObj(x));
        this.function = data.function;
    }

    eval() : ValueType {
        const values = this.list.map(x => this.function.apply(x));
        return values;
    }
}

export class FilterFunction extends RuntimeFunction {
    list     : ValueType[];
    function : LogicalExpression;

    constructor(data: { list:any[], function : LogicalExpression}){
        super(data);
        this.list     = data.list.map(x => makeTermFromObj(x));
        this.function = data.function;
    }

    eval() : ValueType {
        const values = this.list.filter(x => this.function.apply(x));
        return values;
    }
}

export abstract class LogicalExpression extends RuntimeFunction {
    apply(... args:ValueType[]) : boolean {
        throw new MyError();
    }

    eval(): boolean {
        throw new MyError();
    }
}

}