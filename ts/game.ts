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

    const canvas = $("world") as HTMLCanvasElement;
    Canvas.one = new Canvas(canvas);


    const data = await fetchJson(`data/a.json?id=${Math.random()}`);
    for(const obj of data["uis"]){
        for (const [key, value] of Object.entries(obj)) {
            msg(`Key: ${key}, Value: ${value}`);
        }    

        const ui = makeUIFromObj(obj);
        Canvas.one.addUI(ui);
    }

    const grids = Canvas.one.uis.filter(x => x instanceof Grid);
    for(const grid of grids){
        grid.setMinSize();
        grid.layout(grid.position, grid.minSize);
    }

    Sequencer.init(data["actions"]);

    Canvas.one.requestUpdateCanvas();
}


}