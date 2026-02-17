import { fetchTextResponse, msg, MyError, Vec2 } from "@i18n";
import { UI, worldCanvas } from "./widget/core";

export async function fetchJson(url : string) {
    const resp = await fetchTextResponse(url);
    if(resp instanceof Response){
        msg(`fetch json error:${resp.statusText}`);
        throw new MyError();
    }
    else{
        const obj  = JSON.parse(resp);
        return obj;
    }
}

export function getDocumentSize() : Vec2 {
    const document_width  = document.documentElement.clientWidth;
    const document_height = document.documentElement.clientHeight;

    return Vec2.fromXY(document_width, document_height);
}

export function getUIFromId(id : string) : UI {
    for(const ui of worldCanvas.getUIMenus()){
        let all_uis : UI[] = [];
        ui.getAllUI(all_uis);            
        const ui2 = all_uis.find(x => x.id == id);
        if(ui2 != undefined){
            return ui2;
        }
    }

    throw new MyError();
}

export function updateRoot(ui : UI){
    const root = ui.getRootUI();
    root.setMinSize();
    root.layout(root.position, getDocumentSize());

    worldCanvas.requestUpdateCanvas();
}
