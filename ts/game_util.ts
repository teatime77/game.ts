namespace game_ts {
//

export async function fetchJson(url : string) {
    const text = await i18n_ts.fetchText(url);
    const obj  = JSON.parse(text);

    return obj;
}

export function getDocumentSize() : Vec2 {
    const document_width  = document.documentElement.clientWidth;
    const document_height = document.documentElement.clientHeight;
    
    return Vec2.fromXY(document_width, document_height);
}
}