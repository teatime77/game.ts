namespace game_ts {
//
export const shuffle = i18n_ts.shuffle;
export type  MathExprUI = Digit | VariableUI | MathExprLayout;

const additionWithin10s    : [number, number][] = [];
const subtractionWithin10s : [number, number][] = [];
const additionSum11To19    : [number, number][] = [];

let mathExLayout : MathExprUI;

function getAnsLabel(ui : UI) : VariableUI | undefined {
    if(ui instanceof VariableUI){
        return ui.value.name == "ans" ? ui : undefined;
    }
    else if(ui instanceof ContainerUI){
        const target = ui.children.map(x => getAnsLabel(x)).find(x => x != undefined);
        if(target != undefined){
            return target;
        }
    }

    return undefined;
}

export class ArithmeticFormulaExercise extends Action {
    constructor(data : ActionAttr){
        super(data);
    }

    *exec() : Generator<any> {        
        msg("Arithmetic-Formula-Exercise");
        const stage = Stage.mainStage;
        if(stage == undefined){
            throw new MyError();
        }

        const exs = generateAdditionWithin10(5);
        for(const ex of exs){

            if(mathExLayout != undefined){
                stage.removeChild(mathExLayout);
            }

            mathExLayout = makeMathExprLayout(ex.expr);
            stage.addChildren(mathExLayout);
            mathExLayout.setPosition(Vec2.fromXY(10, 10));
            mathExLayout.setMinSizeUpdateLayout();

            const ansLabel = getAnsLabel(mathExLayout);
            if(ansLabel == undefined){
                throw new MyError();
            }

            let num : number = NaN;

            setInputFocus(ansLabel, (n: number) => {
                num = n;
            });

            Canvas.requestUpdateCanvas();


            while(isNaN(num)){
                yield;
            }

            if(num == ex.ans){
                msg(`OK:${ex.expr} ${ex.ans} = ${num}`);
                // const confetti = new ConfettiManager({});
                // const confetti = new ParticleManager({});
                const confetti = new HanamaruDrawer({ position:[500,500], radius : 50});
                stage.addChildren(confetti);
                while(confetti.isRunning){
                    yield;
                }
                stage.removeChild(confetti);
            }
            else{
                msg(`NG:${ex.expr} ${ex.ans} <> ${num}`);
            }
        }
    }
}

class CalcEx {
    expr: App;
    ans : number;

    constructor(expr: string, ans: number) {
        this.expr = parser_ts.parseMath(expr, true) as App;
        this.ans  = ans;
    }

    toString() : string {
        return `${this.expr.str()} : ${this.ans}`;
    }
}

export function generateAdditionWithin10(count : number) : CalcEx[] {
    if(additionWithin10s.length == 0){
        for(const i of range2(1, 10)){
            for(const j of range2(1, 11 - i)){
                additionWithin10s.push([i, j]);
                // msg(`add 10 ${i} ${j}`);
            }
        }
    }

    const nums = shuffle(additionWithin10s).slice(0, count);
    return nums.map(x => new CalcEx(`${x[0]} + ${x[1]} = ans`, x[0] + x[1]));
}

export function generateSubtractionWithin10(count : number) : CalcEx[] {
    if (subtractionWithin10s.length == 0) {
        for (const num1 of range2(2, 11)) {
            // num2（引く数）は 0 から num1 未満まで (答えが1以上になるように)
            // ※ もし答えに 0 を含めたいなら num2 <= num1 にする
            for (const num2 of range2(1, num1)) {
                subtractionWithin10s.push([num1, num2]);
            }
        }
    }

    const nums = shuffle(subtractionWithin10s).slice(0, count);
    return nums.map(x => new CalcEx(`${x[0]} - ${x[1]} = ans`, x[0] - x[1]));
}

export function generateAdditionSum11To19(count : number) : CalcEx[] {
    if(additionSum11To19.length == 0){
        // 1桁の足し算で和が11〜19になる組み合わせ
        // num1, num2 ともに 2〜9 の範囲（1+9などは最大10なので除外される）
        for (const n1 of range2(2, 10)) {
            for (let n2 of range2(2, 10)) {
                const sum = n1 + n2;
                if (sum >= 11 && sum <= 19) {
                    additionSum11To19.push([n1, n2]);
                }
            }
        }    
    }

    const nums = shuffle(additionSum11To19).slice(0, count);
    return nums.map(x => new CalcEx(`${x[0]} + ${x[1]} = ans`, x[0] + x[1]));
}

export function testEx(){
    let exs = generateAdditionWithin10(5);
    exs.forEach(x => msg(`add 10: ${x}`));

    exs = generateSubtractionWithin10(5);
    exs.forEach(x => msg(`sub 10: ${x}`));

    exs = generateAdditionSum11To19(5);
    exs.forEach(x => msg(`sub 11-19: ${x}`));
}

interface MathProblem {
  num1: number;
  num2: number;
  answer: number;
}

class AdditionGenerator {
  /**
   * 和が10以下になる全パターンのリストを作成し、そこからランダムに抽出する
   */
  static generate(count: number, includeZero: boolean = false): MathProblem[] {
    const allPatterns: MathProblem[] = [];
    const startNum = includeZero ? 0 : 1;

    // 1. 和が10以下になる組み合わせを全網羅
    for (let i = startNum; i <= 10; i++) {
      for (let j = startNum; j <= 10 - i; j++) {
        allPatterns.push({
          num1: i,
          num2: j,
          answer: i + j
        });
      }
    }

    // 2. 配列をシャッフル（フィッシャー・イェーツの手法）
    for (let i = allPatterns.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [allPatterns[i], allPatterns[r]] = [allPatterns[r], allPatterns[i]];
    }

    // 3. 必要な数だけ返す
    return allPatterns.slice(0, count);
  }
}

// export class Exercise extends Lesson {

// }

}