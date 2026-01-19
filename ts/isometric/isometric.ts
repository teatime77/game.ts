namespace game_ts {
//
// タイルの設定
const TILE_COLS = 10;
let TILE_WIDTH  : number;
let TILE_HEIGHT : number;
const houseSize = 128;
const pageSize = 5;


let offsetX : number;
let offsetY : number;
let pathHeight : number;
const pathCycle = 2;
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


function drawGrid(ctx : CanvasRenderingContext2D){
    const can = worldCanvas.canvas;
    const image = imageMap.get("grassland.png");
    if(image == undefined){
        Canvas.requestUpdateCanvas();
    } 
    else{
        for(let y = -TILE_HEIGHT; y < can.height; y += TILE_HEIGHT){
            for(const [offsetX, offsetY] of [[0, 0], [TILE_WIDTH / 2, TILE_HEIGHT / 2]]){
                for(let x = -TILE_WIDTH; x < can.width; x += TILE_WIDTH){
                    ctx.drawImage(image, offsetX + x, offsetY + y, TILE_WIDTH, TILE_HEIGHT);
                }
            }
        }
    }
}

export function clearIsometric(){
    worldCanvas.isIsometric = false;
    // worldCanvas.removeUIs(worldGraph);
}

export function initIsometric(canvas : Canvas, map : any){
    worldCanvas.isIsometric = true;
    currentPage = 0;

    TILE_WIDTH  = (canvas.canvas.width  * 0.9) / TILE_COLS;
    // TILE_HEIGHT = (canvas.canvas.height * 0.9) / GY;
    TILE_HEIGHT = TILE_WIDTH / 2;

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
            path : lesson.path,
            lesson : lesson.lesson,
            args : lesson.args
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

    pathHeight = worldCanvas.canvas.height * 0.9; 

    const vertices = drawGrid(ctx);

    drawPath();

    drawHouses();
}

function drawHouses(){
    for(const [idx, img, label] of i18n_ts.zip(houseImages, lessonLabels)){
        const t = (idx + 1) / (pageSize + 1);
        const pos = getPositionInPath(t);
                
        img.setCenterPosition(pos);

        const x = Math.min(worldCanvas.canvas.width - 5 - label.size.x, Math.max(5, pos.x - label.size.x / 2));
        const y = img.getBottom();
        label.setPosition(Vec2.fromXY(x, y));
    }
}

// 3D座標から2D座標への変換
function project(pos: Vec3) : Vec2 {
    const screenX =  (pos.x - pos.y) * (TILE_WIDTH / 2);
    const screenY = -(pos.x + pos.y) * (TILE_HEIGHT / 2) + pos.z;
    return Vec2.fromXY(screenX, screenY);
}


export function getPositionInPath(t : number) : Vec2 {
    const amplitude = worldCanvas.canvas.width  * 0.4;
    const x = offsetX + Math.sin(t * (2 * Math.PI * pathCycle)) * amplitude;
    const y = offsetY - t * pathHeight

    return new Vec2(x, y);
}

function drawPath(){
    const pathPoints = range(100).map(i => getPositionInPath(i / (100 - 1) ));

    worldCanvas.drawPolyLines(pathPoints, "brown", 30);
}




}