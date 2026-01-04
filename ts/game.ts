namespace game_ts {
//
let urlOrigin : string;
const objMap : Map<string, UI> = new Map<string, UI>();

export function addObject(id : string, obj : UI){
    if(objMap.has(id)){
        throw new MyError();        
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

    const canvas = new Canvas($("world") as HTMLCanvasElement);

    const data : {
        uis: any[],
        menus : any[],
        actions : any[]
    } = await fetchJson(`data/a.json?id=${Math.random()}`);

    for(const obj of data.uis){
        for (const [key, value] of Object.entries(obj)) {
            // msg(`Key: ${key}, Value: ${value}`);
        }    

        const ui = makeUIFromObj(obj);
        canvas.addUI(ui);
    }

    const grids = canvas.getUIMenus().filter(x => x instanceof Grid);

    const root = new TreeNode({label:"root"});
    // makeTreeNodeFromObject(root, "canvas", canvas, new Set<any>());
    makeTreeNodeFromObject(root, "json", data, new Set<any>());

    const inspector = getUIFromId("inspector") as TreeNode;
    inspector.addChild(root);

    const document_size = getDocumentSize();

    for(const grid of grids){
        grid.setMinSize();
        grid.layout(grid.position, document_size);
    }

    const popup_menus = data.menus.map(x => makeUIFromObj(x)) as PopupMenu[];
    initPopupMenus(popup_menus);

    Sequencer.init(data.actions);

    Canvas.requestUpdateCanvas();

    // dumpObj(canvas, 0, new Set<any>());
}


}