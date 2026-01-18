namespace game_ts {
//
type Point = { x: number; y: number };

export const GX = 25;
export const GY = 25;
const NEAR = 4;

class PathGenerator {
    private width: number;
    private height: number;
    private path: Point[] = [];
    private visited: Set<string> = new Set();

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    private toKey(p: Point) { return `${p.x},${p.y}`; }

    generate(steps: number): Point[] {
        let current: Point = { x: GX, y: GY }; // 下端(y=0)からスタート
        this.path = [current];
        this.visited.add(this.toKey(current));

        for (let i = 0; i < steps; i++) {
            const next = this.getNextStep(current);
            if (!next) break; // 進める場所がなくなれば終了

            this.path.push(next);
            this.visited.add(this.toKey(next));
            current = next;
        }
        return this.path;
    }

    private getNextStep2(current: Point): Point | null {
        if(current.x == 0){

            if(current.y == 0){
                return null;
            }
            return { x:current.x    , y : current.y - 2};
        }
        else if(current.y == 0){
            return { x:current.x - 2, y : current.y };
        }

        const rnd = Math.random();
        let next: Point;
        if(rnd < 0.5){
            next = { x:current.x - 2, y : current.y };
        }
        else{
            next = { x:current.x    , y : current.y - 2};
        }

        return next;
    }

    private getNextStep(current: Point): Point | null {
        if(Math.max(current.x, current.y) < NEAR){
            return null;
        }
        if(current.x + current.y == 0){
            return null;
        }

        for(const _ of range(100)){
            const rnd = Math.random();
            let next: Point;
            if(rnd < 0.3){
                next = { x:current.x - 2, y : current.y };
                if(current.x == 0){
                    continue;
                }
            }
            else if(rnd < 0.6){
                next = { x:current.x, y : current.y - 2};
                if(current.y == 0){
                    continue;
                }
            }
            else if(rnd < 0.8){
                next = { x:current.x + 2, y : current.y };
                if(current.x == GX){
                    continue;
                }
            }
            else{
                next = { x:current.x    , y : current.y + 2};
                if(current.y == GY){
                    continue;
                }
            }

            if(! this.visited.has(this.toKey(next))){
                return next;
            }
        }

        return null;
    }

    private getNextStepOLD(current: Point): Point | null {
        // 方向の候補（上、右、左）
        // [0, 1] を増やすことで上に進む確率を調整（重み付け）
        const directions: Point[] = [
            { x: 0, y: 1 }, { x: 0, y: 1 }, // 上 (重み2)
            { x: 1, y: 0 },                 // 右
            { x: -1, y: 0 }                 // 左
        ];

        // シャッフルしてランダム性を出す
        const shuffledDirs = directions.sort(() => Math.random() - 0.5);

        for (const dir of shuffledDirs) {
            const next: Point = { x: current.x + dir.x, y: current.y + dir.y };

            // 画面内かつ未訪問かチェック
            if (this.isValid(next)) {
                return next;
            }
        }
        return null;
    }

    private isValid(p: Point): boolean {
        return p.x >= 0 && p.x < this.width &&
               p.y >= 0 && p.y < this.height &&
               !this.visited.has(this.toKey(p));
    }
}


let roadMap : Point[] = [];

export function testPathGenerator(){
    // 使い方
    const generator = new PathGenerator(10, 10); // 横5マス、縦10マスの領域

    let roads : Point[][] = [];
    for(const _ of range(100)){
        const road = generator.generate(100);
        const p = last(road);
        if(Math.max(p.x, p.y) < NEAR){
            roads.push(road);
            roadMap = road;
            return;
        }
    }
    // const roads = range(20).map(x => generator.generate(100));
    // roadMap = generator.generate(30); // 15ステップ、開始地点x=2

    msg(`roads:${roads.length}`);

    roadMap = roads.reduce((prev, current) => { return current.length > prev.length ? current : prev; }, []);
}
export function drawPath(ctx : CanvasRenderingContext2D, offset:Vec2){
    if(roadMap.length == 0){
        testPathGenerator();
    }

    const pts : Vec2[] = [];
    for(const [idx, p] of roadMap.entries()){
        const pos = project(new Vec3(p.x, p.y, 0)).add(offset);
        pts.push(pos);
    }

    worldCanvas.drawPolyLines(pts, "orange", 10);

    const cs = [ [0, 0], [0, GY], [GX, GY], [GX, 0]  ];
    const colors = [ "red", "green", "blue", "yellow" ]
    for(const [i,c] of cs.entries()){
        const p = project(new Vec3(c[0], c[1], 0)).add(offset);
        worldCanvas.drawCircle(p, 10, colors[i]);
    }
}


}