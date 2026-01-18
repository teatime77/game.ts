namespace game_ts {
//
export const GX = 25;
export const GY = 25;

let roadMap : Vec2[] = [];

export function drawPath(ctx : CanvasRenderingContext2D, offset:Vec2){
    if(roadMap.length == 0){
        // roadMap = generateVerticalPath(GY, 2);

        roadMap = range(100).map(i => calcPathPosition(GY, 12, 2, i / (100 - 1) ));
    }

    const pts = roadMap.map(p => project(new Vec3(p.x, p.y, 0)).add(offset));
    worldCanvas.drawPolyLines(pts, "orange", 10);
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