namespace game_ts {
//
export const GX = 10;
export const GY = 10;

let roadMap : Vec2[] = [];

export function drawPath(ctx : CanvasRenderingContext2D, offset:Vec2){
    if(roadMap.length == 0){
        // roadMap = generateVerticalPath(GY, 2);

        roadMap = range(100).map(i => calcPathPosition(GY, 2, i / (100 - 1) ));
    }

    const pts = roadMap.map(p => project(new Vec3(p.x, p.y, 0)).add(offset));
    worldCanvas.drawPolyLines(pts, "brown", 30);
}

export function getPositionInPath(t : number) : Vec2 {
    return calcPathPosition(GY, 2, t);
}


function calcPathPosition(height: number, cycle : number, t : number) : Vec2 {
    const amplitude = 0.4 * GX;
    const baseDir = t * height;
    const offset = Math.sin(t * (2 * Math.PI * cycle)) * amplitude;

    return new Vec2(baseDir + offset,baseDir - offset);
}


}