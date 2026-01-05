namespace game_ts {
//

export async function fetchJson(url : string) {
    const resp = await i18n_ts.fetchTextResponse(url);
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
}