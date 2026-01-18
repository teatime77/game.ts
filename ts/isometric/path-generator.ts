namespace game_ts {
//
type Point = { x: number; y: number };

export const GX = 25;
export const GY = 25;



let roadMap : Point[] = [];

export function drawPath(ctx : CanvasRenderingContext2D, offset:Vec2){
    if(roadMap.length == 0){
        // roadMap = generateVerticalPath(GY, 2);

        roadMap = range(100).map(i => calcPathPosition(GY, 12, 2, i / (100 - 1) ));
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


function calcPathPosition(height: number, amplitude : number, cycle : number, t : number) : Vec2 {
    const baseDir = t * height;
    const offset = Math.sin(t * (2 * Math.PI * cycle)) * amplitude;

    return new Vec2(baseDir + offset,baseDir - offset);
}

function generateVerticalPath(height: number, cycle : number) {
    const amplitude = 8;   // 蛇行の幅
    const path = [];
    const div = 2;
    const steps = height * div;
    // const frequency = 0.4; // 蛇行の周期
    const frequency = (2 * Math.PI * cycle) / steps;

    // 2PI * cycle = steps * frequency
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // i = t * steps
        // baseDir = (t * steps) / div = (t * height * div) / div = t * height
        // i * frequency = (t * steps) * ((2 * Math.PI * cycle) / steps) = t * (2 * Math.PI * cycle)

        // ベースとなる論理座標は x = i, y = i
        // これにより、画面上では常に真上に進む軸ができる
        const baseDir = i / div;

        // sin波によるオフセット（xを増やすならyを減らす、またはその逆）
        // x - y の結果を揺らすことで、スクリーン上のX座標を揺らす
        const offset = Math.sin(i * frequency) * amplitude;

        path.push({
            x: baseDir + offset,
            y: baseDir - offset
        });
    }
    return path;
}


}