namespace game_ts {
//
export interface JsonData {
    imports? : string[];
    uis: any[];
    menus : any[];
    actions : any[];
}

const symbolMap = new Map<string, UI>();

export class SymbolRef {
    static async importLibrary(url : string){
        const path = url.replaceAll(".", "/");
        const data : JsonData = await fetchJson(`data/${path}.json?id=${Math.random()}`);
        msg(`lib:${url}\n ${JSON.stringify(data, null, 4)}`);

        const uis = data.uis.map(x => makeUIFromObj(x));
        for(const ui of uis){
            if(ui.name === undefined){
                throw new MyError();
            }

            const key = `${url}.${ui.name}`;
            symbolMap.set(key, ui);
        }
    }

    static lookupRegistry(data : { className : string, path : string }){
        const ui = symbolMap.get(data.path);
        if(ui == undefined){
            throw new MyError();
        }

        return ui;
    }
}


}