namespace game_ts {
//
let urlOrigin : string;
const objMap : Map<string, UI> = new Map<string, UI>();
let worldCanvas : Canvas;
let worldData : JsonData;

export function addObject(id : string, obj : UI){
    if(objMap.has(id)){
        // throw new MyError();        
        msg(`dup obj:${id}`);
    }

    objMap.set(id, obj);
}

export function getObjectById(id : string) : UI {
    const obj = objMap.get(id);
    if(obj == undefined){
        throw new MyError();
    }

    return obj;
}



document.addEventListener('DOMContentLoaded', async () => {
    await asyncBodyOnLoad();
});  

async function asyncBodyOnLoad(){
    msg("loaded");
    let pathname  : string;
    let params = new Map<string, string>();

    [ urlOrigin, pathname, params ] = i18n_ts.parseURL();
    msg(`origin:[${urlOrigin}] path:[${pathname}]`);

    for (const [key, value] of params.entries()) {
        msg(`Key: ${key}, Value: ${value}`);
    }

    initSpeech();

    worldCanvas = new Canvas($("world") as HTMLCanvasElement);

    worldData   = await fetchJson(`data/dev.json?id=${Math.random()}`);

    if(worldData.target == undefined){
        throw new MyError();
    }
    await loadWorld(worldData.target);
    // dumpObj(canvas, 0, new Set<any>());
}

export async function loadWorld(target : string){
    const canvas : Canvas   = worldCanvas;
    const data   : JsonData = worldData;

    Canvas.isReady = false;

    SymbolRef.clearSymbolMap();
    canvas.clearUIs();

    const stageData = await SymbolRef.importLibrary(target);

    if(data.imports != undefined){
        for(const path of data.imports){
            await SymbolRef.importLibrary(path);
        }
    }

    for(const obj of data.uis){
        const ui = makeUIFromObj(obj);
        canvas.addUI(ui);
    }

    const root = new TreeNode({label:"root"});
    // makeTreeNodeFromObject(root, "canvas", canvas, new Set<any>());
    makeTreeNodeFromObject(root, "json", data, new Set<any>());

    const inspector = getUIFromId("inspector") as TreeNode;
    inspector.addChild(root);

    canvas.layoutCanvas();

    initPopupMenus(stageData.menus);

    Sequencer.init(stageData.actions);

    Canvas.isReady = true;
}



}