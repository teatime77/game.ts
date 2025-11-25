namespace game_ts {
//
let urlOrigin : string;






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

    const obj = await fetchJson("data/a.json");
    for (const [key, value] of Object.entries(obj)) {
        msg(`Key: ${key}, Value: ${value}`);
    }    

}


}