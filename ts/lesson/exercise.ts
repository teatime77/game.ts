namespace game_ts {
//
export const shuffle = i18n_ts.shuffle;

const additionWithin10s    : [number, number][] = [];
const subtractionWithin10s : [number, number][] = [];
const additionSum11To19    : [number, number][] = [];

export class ArithmeticFormulaExercise extends Action {
    static layout : Digit | VariableUI | MathExprLayout;
    prevTime : number;

    constructor(data : ActionAttr){
        super(data);
        this.prevTime = Date.now();
    }

    *exec() : Generator<any> {        
        msg("Arithmetic-Formula-Exercise");
        const stage = Stage.mainStage;
        if(stage == undefined){
            throw new MyError();
        }

        const exs = generateAdditionWithin10(5);
        for(const ex of exs){

            if(ArithmeticFormulaExercise.layout != undefined){
                stage.removeChild(ArithmeticFormulaExercise.layout);
            }

            ArithmeticFormulaExercise.layout = makeMathExprLayout(ex.expr);
            stage.addChildren(ArithmeticFormulaExercise.layout);
            ArithmeticFormulaExercise.layout.setPosition(Vec2.fromXY(10, 10));
            ArithmeticFormulaExercise.layout.setMinSizeUpdateLayout();
            Canvas.requestUpdateCanvas();


            while(Date.now() - this.prevTime < 1000){
                yield;
            }

            this.prevTime = Date.now();
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