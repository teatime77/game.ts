namespace game_ts {
//
let urlOrigin : string;






document.addEventListener('DOMContentLoaded', async () => {
    await asyncBodyOnLoad();
});  

function makeUIFromObj(obj : any) : UI {
    const attr = obj as UIAttr;

    switch(attr.className){
    case Label.name  : return new Label(obj as TextUIAttr);
    case Button.name : return new Button(obj as TextUIAttr);
    case ImageUI.name: return new ImageUI(obj as UIAttr);
    case Star.name   : return new Star(obj as UIAttr);
    case Firework.name: return new Firework(obj as (UIAttr & { numStars: number}));
    case Slider.name  : return new Slider(obj as UIAttr);
    case Grid.name    : {
        obj.children = (obj.children as any[]).map(x => makeUIFromObj(x));
        return new Grid(obj as (UIAttr & { columns?: string, rows? : string, children : UI[] }));
    }
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

    Canvas.one.requestUpdateCanvas();
}


}