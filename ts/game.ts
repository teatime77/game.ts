namespace game_ts {
//
let urlOrigin : string;






document.addEventListener('DOMContentLoaded', async () => {
    await asyncBodyOnLoad();
});  

export function makeUIFromObj(obj : any) : UI {
    const attr = obj as UIAttr;

    switch(attr.className){
    case Label.name  : return new Label(obj as TextUIAttr);
    case Button.name : return new Button(obj as TextUIAttr);
    case ImageUI.name: return new ImageUI(obj as UIAttr);
    case Star.name   : return new Star(obj as UIAttr);
    case Firework.name: return new Firework(obj as (UIAttr & { numStars: number}));
    case Slider.name  : return new Slider(obj as UIAttr);
    case Stage.name   : return new Stage(obj as (UIAttr & { children : any[] }))
    case Grid.name    : return new Grid(obj  as (UIAttr & { children : any[], columns?: string, rows? : string }));


    }

    throw new MyError();
}

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

    Sequencer.one = new Sequencer();
    for(const obj of data["actions"]){
        for (const [key, value] of Object.entries(obj)) {
            msg(`Key: ${key}, Value: ${value}`);
        }    

        const action = makeActionFromObj(obj);
        Sequencer.one.addAction(action);
    }

    testGen();

    const grids = Canvas.one.uis.filter(x => x instanceof Grid);
    for(const grid of grids){
        grid.setMinSize();
        grid.layout(grid.position, grid.minSize);
    }

    Canvas.one.requestUpdateCanvas();
}


}