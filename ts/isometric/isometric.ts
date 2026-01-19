namespace game_ts {
//
// タイルの設定
let TILE_WIDTH  : number;
let TILE_HEIGHT : number;
const houseSize = 128;
const pageSize = 5;


let offsetX : number;
let offsetY : number;
let offset  : Vec2;
let worldGraph : Graph;

let currentPage : number;
let allLessons : GraphNode[];

let houseImages : ImageUI[] = [];
let lessonLabels : Label[] = [];

let upButton : Button;
let downButton : Button;

export class Vec3 {
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


function drawGrid(ctx : CanvasRenderingContext2D, pos : Vec3, size : Vec2) : Vec2[] {
    // 描画順序が重要：奥（x+yが小さい方）から手前へ
    for (let x = 0; x < size.x + 1; x++) {
        for (let y = 0; y < size.y + 1; y++) {
            // 前回の project 関数を使って座標を計算
            const pos2 = project(new Vec3(pos.x + x, pos.y + y, pos.z )).add(offset);
            drawQImage(ctx, "grassland.png", pos2, TILE_WIDTH, TILE_HEIGHT);
        }
    }

    const pt1s : Vec3[] = [
        new Vec3(pos.x         , pos.y, pos.z),
        new Vec3(pos.x + size.x, pos.y, pos.z),
        new Vec3(pos.x + size.x, pos.y + size.y, pos.z),
        new Vec3(pos.x         , pos.y + size.y, pos.z)
    ];

    const pt2 = pt1s.map(p => project(p).add(offset));
    worldCanvas.drawPolygon(pt2, "brown", 5);

    return pt2;
}

export function clearIsometric(){
    worldCanvas.isIsometric = false;
    // worldCanvas.removeUIs(worldGraph);
}

export function initIsometric(canvas : Canvas, map : any){
    worldCanvas.isIsometric = true;
    currentPage = 0;

    TILE_WIDTH  = (canvas.canvas.width  * 0.9) / GX;
    TILE_HEIGHT = (canvas.canvas.height * 0.9) / GY;

    worldGraph = makeGraph(map);
    worldGraph.setPosition(Vec2.fromXY(canvas.canvas.width / 2, 50));
    worldGraph.updateLayout();
    canvas.addUI(worldGraph);

    allLessons = worldGraph.nodes.filter(x => !x.isCluster);

    addImage("grassland.png");

    loadStageMapPage();
}

async function pageUp(){
    if((currentPage + 1) * pageSize < allLessons.length){
        currentPage++;
        loadStageMapPage();
    }
    msg("page up");
}

async function pageDown(){
    if(0 < currentPage){
        currentPage--;
        loadStageMapPage();
    }
    msg("page down");
}

function makeUpDownButton(){
    upButton = new Button({
        text : "↑"
    });

    downButton = new Button({
        text : "↓"
    });

    upButton.clickHandler = pageUp;
    downButton.clickHandler = pageDown;

    for(const button of [upButton, downButton]){
        worldCanvas.addUI(button);
        button.setMinSize();
    }

    upButton.setPosition(Vec2.fromXY(20, 20));
    downButton.setPosition(Vec2.fromXY(20, upButton.getBottom() + 20));
}

export function loadStageMapPage(){
    worldCanvas.isIsometric = true;
    worldCanvas.clearUIs();
    // worldCanvas.removeUIs(...houseImages, ...lessonLabels)
    houseImages = [];
    lessonLabels = [];

    const lessons = allLessons.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    for(const [idx, lesson] of lessons.entries()){
        const img = new ImageUI({ 
            imageFile:`house-${idx+1}.png`,
            size : [houseSize, houseSize],
            borderWidth : 0,
            padding : 0
        });
        img.setMinSize();

        houseImages.push(img);
        worldCanvas.addUI(img);

        const label = new Label({
            text : lesson.text,
            path : lesson.path
        });

        lessonLabels.push(label);
        worldCanvas.addUI(label);

        label.setMinSize();
    }

    makeUpDownButton();
}

export function drawIsometric(ctx : CanvasRenderingContext2D){
    // 画面中央にオフセットを乗せる
    offsetX = worldCanvas.canvas.width  * 0.5; 
    offsetY = worldCanvas.canvas.height * 0.95; 
    offset = new Vec2(offsetX, offsetY);

    const vertices = drawGrid(ctx, new Vec3(0, 0, 0), new Vec2(GX, GY));

    drawPath(ctx, Vec2.fromXY(offsetX, offsetY));

    drawHouses(ctx);
    drawVertices(ctx, vertices);
}

function drawHouses(ctx : CanvasRenderingContext2D){
    for(const [idx, img, label] of i18n_ts.zip(houseImages, lessonLabels)){
        const t = (idx + 1) / (pageSize + 1);
        const p = getPositionInPath(t);
        const pos = project(new Vec3(p.x, p.y, 0)).add(offset);
                
        img.setCenterPosition(pos);

        const x = img.getRight() + 5;
        const y = img.position.y;
        label.setPosition(Vec2.fromXY(x, y));
    }
}

function drawVertices(ctx : CanvasRenderingContext2D, pt2 : Vec2[]){
    const colors = [ "red", "green", "blue", "yellow" ]
    for(const [i,c] of pt2.entries()){
        worldCanvas.drawCircle(c, 10, colors[i]);
    }

    const can = worldCanvas.canvas;
    msg(`canvas:[${can.width}, ${can.height}] size:[${pt2[3].x - pt2[1].x}, ${pt2[2].y - pt2[0].y}] tile:[${GX * TILE_WIDTH}, ${GY * TILE_HEIGHT}]`);
}

// 3D座標から2D座標への変換
export function project(pos: Vec3) : Vec2 {
    const screenX =  (pos.x - pos.y) * (TILE_WIDTH / 2);
    const screenY = -(pos.x + pos.y) * (TILE_HEIGHT / 2) + pos.z;
    return Vec2.fromXY(screenX, screenY);
}

function drawQImage(ctx : CanvasRenderingContext2D, imageFile : string, screen: Vec2, width : number, height : number){
    const image = imageMap.get(imageFile);
    if(image == undefined){
        Canvas.requestUpdateCanvas();
    } 
    else{
        
        const x = screen.x - width / 2;
        const y = screen.y - height / 2;
        ctx.drawImage(image, x, y, width, height);
        ctx.strokeRect(x, y, width, height);
    }
}


}