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
        for(const action of this.actions){
            for(const ret of action.exec()){
                yield ret;
            }
        }

        return "seq end";
    }
}

export class ParallelAction extends CompositeAction {
    *exec() : Generator<any> {
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

        return "para end";
    }
}

export class Sequencer  {
    static one : Sequencer;

    actions : Action[] = [];

    addAction(action : Action){
        this.actions.push(action);
    }

    run(){
        for(const action of this.actions){
            for(const ret of action.exec()){
                msg(`run ${ret}`);
            }
        }
    }
}

export function testGen(){
    Sequencer.one.run();
}

/*
export function testGen(){
    const seq_nums = range(5).map(x => new NumAction(x + 1));
    const seq  = new SequentialAction(seq_nums);

    const para_nums = range(5).map(x => new NumAction(x + 1));
    const para = new ParallelAction(para_nums);

    msg("begin seq");
    for(const x of seq.exec()){
        msg(`main seq ${x}`);
    }

    msg("begin para");
    for(const x of para.exec()){
        msg(`main para ${x}`);
    }
}
*/

// 1. 内側のジェネレーター (文字列を yield し、最後に数値を return)
function* innerGenerator(): Generator<string, number, string> {
    console.log("  [Inner] 開始");
    
    const message = yield "ステップ1: 内側からメッセージA";
    console.log(`  [Inner] next()から受け取った値: ${message}`);
    
    yield "ステップ2: 内側からメッセージB";
    
    console.log("  [Inner] 終了。戻り値を返す");
    return 999; // yield* 式の結果として outerGenerator に返される
}

// 2. 外側のジェネレーター (yield* を使用)
function* outerGenerator(): Generator<string, string, string> {
    console.log("[Outer] 開始");
    
    yield "ステップ0: 外側からメッセージ";
    
    // innerGenerator の実行を委任
    const resultFromInner = yield* innerGenerator(); // innerGenerator の return 値(999)を受け取る
    
    console.log(`[Outer] innerGeneratorの戻り値: ${resultFromInner}`);
    
    yield "ステップ3: innerGenerator 完了後の外側からメッセージ";
    
    console.log("[Outer] 終了");
    return "完了";
}


export function testGen2(){
    const generator = outerGenerator();
    msg("after outer-Generator creation")

    // A: next() で実行開始。outerGenerator の最初の yield で停止。
    console.log("A:", generator.next()); 
    // 出力: [Outer] 開始
    // A: { value: 'ステップ0: 外側からメッセージ', done: false }

    // B: next() は innerGenerator に転送され、inner の最初の yield で停止。
    console.log("B:", generator.next("Bから送る値"));
    // 出力: [Inner] 開始
    // B: { value: 'ステップ1: 内側からメッセージA', done: false }

    // C: next() に渡された値 'Cから送る値' は innerGenerator に渡される。
    // inner はその値を受け取り、次の yield で停止。
    console.log("C:", generator.next("Cから送る値"));
    // 出力:   [Inner] next()から受け取った値: Cから送る値
    // C: { value: 'ステップ2: 内側からメッセージB', done: false }

    // D: next() で innerGenerator が終了し、その戻り値(999)が outerGenerator に戻る。
    // outerGenerator は inner の戻り値を受け取った後、次の yield で停止。
    console.log("D:", generator.next()); 
    // 出力:   [Inner] 終了。戻り値を返す
    // 出力: [Outer] innerGeneratorの戻り値: 999
    // D: { value: 'ステップ3: innerGenerator 完了後の外側からメッセージ', done: false }

    // E: outerGenerator が終了し、その戻り値が返される。
    console.log("E:", generator.next()); 
    // 出力: [Outer] 終了
    // E: { value: '完了', done: true }
}













}