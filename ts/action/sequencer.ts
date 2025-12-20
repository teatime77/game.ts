namespace game_ts {
//
abstract class CompositeAction extends Action {
    actions : Action[] = [];

    constructor(data : ActionAttr & {actions : any[]}){
        super(data);
        this.actions = data.actions.map(x => makeActionFromObj(x));
    }
}

export class SequentialAction extends CompositeAction {
    *exec() : Generator<any> {
        this.finished = false;

        for(const action of this.actions){
            for(const ret of action.exec()){
                yield ret;
            }
        }

        this.finished = true;
        return "seq end";
    }
}

export class ParallelAction extends CompositeAction {
    *exec() : Generator<any> {
        this.finished = false;

        let gens : Generator<any>[] = this.actions.map(x => x.exec());

        while(gens.length != 0){
            for(const gen of gens.slice()){
                const ret = gen.next();
                if(ret.done){
                    remove(gens, gen);
                }
                else{
                    yield ret.value;
                }
            }
        }

        this.finished = true;
        return "para end";
    }
}

export class Sequencer  {
    static one : Sequencer;

    static rootParallelAction : ParallelAction;
    static generator : Generator<any> | undefined;

    static init(actions : any[]){
        Sequencer.rootParallelAction = new ParallelAction({ className:"ParallelAction", actions });
    }

    static start(){
        Sequencer.generator = Sequencer.rootParallelAction.exec();

        const ret = Sequencer.generator.next();
        msg(`start ${ret.value}`);
        Canvas.requestUpdateCanvas();
    }

    static nextAction(){
        if(Sequencer.generator == undefined || Sequencer.rootParallelAction.finished){
            return;
        }

        const ret = Sequencer.generator.next();
        if(ret.value != undefined){
            msg(`next ${ret.value}`);
        }

        Canvas.requestUpdateCanvas();
    }
}


}