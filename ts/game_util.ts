namespace game_ts {
//

export async function fetchJson(url : string) {
    const text = await i18n_ts.fetchText(url);
    const obj  = JSON.parse(text);

    return obj;
}
}