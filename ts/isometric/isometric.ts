namespace game_ts {
//
// タイルの設定
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

let offsetX : number;
let offsetY : number;
let worldGraph : Graph;

class Vec3 {
    x: number;
    y: number;
    z: number;

    static fromXYZ(x : number, y : number, z : number){
        return new Vec3(x, y, z);
    }

    constructor(x : number, y : number, z : number){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toString() : string {
        return `(${Math.round(this.x)}, ${Math.round(this.y)}, ${Math.round(this.z)})`
    }
}

let renderer : IsometricRenderer;

class IsometricRenderer {
    private canvas : Canvas;

    constructor(canvas : Canvas) {
        this.canvas = canvas;
    }

    // 3D座標から2D座標への変換
    project(pos: Vec3) : Vec2 {
        const screenX = (pos.x - pos.y) * (TILE_WIDTH / 2);
        const screenY = (pos.x + pos.y) * (TILE_HEIGHT / 2) - pos.z;
        return Vec2.fromXY(screenX, screenY);
    }

    drawImage(ctx : CanvasRenderingContext2D, imageFile : string, pos: Vec3){
        const image = imageMap.get(imageFile);
        if(image == undefined){
            // msg(`no img:${this.imageFile}`);
            Canvas.requestUpdateCanvas();
        } 
        else{
            const screen = this.project(pos);
            
            const x = screen.x + offsetX;
            const y = screen.y + offsetY;
            ctx.drawImage(image, x, y, TILE_WIDTH, TILE_HEIGHT);
            msg(`${x.toFixed()} ${y.toFixed()}`);
        }
    }

    drawGrid(ctx : CanvasRenderingContext2D, pos : Vec3, size : Vec2) {
        // 描画順序が重要：奥（x+yが小さい方）から手前へ
        for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
                // 前回の project 関数を使って座標を計算
                const pos2 = new Vec3(pos.x + x - 0.5, pos.y + y + 0.5, pos.z );
                this.drawImage(ctx, "grassland.png", pos2);
            }
        }

        const pt1s : Vec3[] = [
            new Vec3(pos.x         , pos.y, pos.z),
            new Vec3(pos.x + size.x, pos.y, pos.z),
            new Vec3(pos.x + size.x, pos.y + size.y, pos.z),
            new Vec3(pos.x         , pos.y + size.y, pos.z)
        ];

        const pt2 = pt1s.map(p => this.project(p).add(new Vec2(offsetX, offsetY)));
        worldCanvas.drawPolygon(pt2, "brown", 5);
    }


}

const mapWidth = 8;  // タイルの列数
const mapHeight = 8; // タイルの行数



export function initIsometric(canvas : Canvas, map : any){
    worldGraph = makeGraph(map);
    worldGraph.setPosition(Vec2.fromXY(200, 300));
    worldGraph.updateLayout();

    renderer = new IsometricRenderer(canvas);
    addImage("grassland.png");
}

export function drawIsometric(ctx : CanvasRenderingContext2D){
    // 画面中央にオフセットを乗せる
    offsetX = worldCanvas.canvas.width  / 2; 
    offsetY = worldCanvas.canvas.height / 4; 

    renderer.drawGrid(ctx, new Vec3(-4, 0, 0), new Vec2(5, 5));
    renderer.drawGrid(ctx, new Vec3(4, 2, 1), new Vec2(3, 3));

    worldGraph.drawTop(ctx);
}

}