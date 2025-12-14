namespace game_ts {
//
export interface ActionAttr {
    className : string;
}

export abstract class Action {
    finished : boolean = false;

    constructor(data : ActionAttr){  
    }

    *exec() : Generator<any> {
        throw new Error();
    }
}

export class NumAction extends Action {
    count : number;

    constructor(data : ActionAttr & {count : number}){
        super(data);
        this.count = data.count;
    }

    *exec() : Generator<any> {
        for(const i of range(this.count)){
            const value = `num ${i + 1}/${this.count}`;
            // msg()
            yield `gen ${i + 1}/${this.count}`;
        }

        return `num end ${this.count}`;
    }

}


export function makeActionFromObj(obj : any) : Action {
    const attr = obj as ActionAttr;

    switch(attr.className){
    case NumAction.name        : return new NumAction(obj as (ActionAttr & {count : number}));
    case SequentialAction.name : return new SequentialAction(obj as (ActionAttr & {actions : any[]}));
    case ParallelAction.name   : return new ParallelAction(obj   as (ActionAttr & {actions : any[]}));
    }

    throw new MyError();
}

}