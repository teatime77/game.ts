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

export function getPositionInPath(t : number) : Vec2 {
    return calcPathPosition(GY, 12, 2, t);
}


function calcPathPosition(height: number, amplitude : number, cycle : number, t : number) : Vec2 {
    const baseDir = t * height;
    const offset = Math.sin(t * (2 * Math.PI * cycle)) * amplitude;

    return new Vec2(baseDir + offset,baseDir - offset);
}


}