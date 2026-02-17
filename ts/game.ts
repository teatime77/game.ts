import { msg, MyError, $, parseURL } from "@i18n";
import './widget/container';
import './widget/slider';
import './widget/scroll_view';
import './widget/misc';
import './action/speech';

import { initSpeech } from "./action/speech";
import { Sequencer } from "./action/sequencer";
import { fetchJson, getUIFromId } from "./game_util";
import { initIsometric, clearIsometric } from "./isometric/isometric";
import { testEx } from "./lesson/exercise";
import { ArithmeticView, termToUIs } from "./math/arithmetic/arithmetic";
import { JsonData, SymbolRef } from "./registry";
import { Canvas } from "./widget/canvas";
import { makeUIFromJSON, setCanvas, worldCanvas } from "./widget/core";
import { initPopupMenus } from "./widget/menu";
import { TreeNode, makeTreeNodeFromObject } from "./widget/tree";

let urlOrigin : string;
export let isDev : boolean = false;
let worldData : JsonData;

document.addEventListener('DOMContentLoaded', async () => {
    await asyncBodyOnLoad();
});  

async function asyncBodyOnLoad(){
    msg("loaded");
    let pathname  : string;
    let params = new Map<string, string>();

    [ urlOrigin, pathname, params, ] = parseURL();
    msg(`origin:[${urlOrigin}] path:[${pathname}]`);

    for (const [key, value] of params.entries()) {
        msg(`Key: ${key}, Value: ${value}`);
        if(key == "dev" && value == "true"){
            isDev = true;
            msg("dev mode");
        }
    }

    initSpeech();

    setCanvas(new Canvas($("world") as HTMLCanvasElement))

    if(isDev){
        worldData   = await fetchJson(`data/dev.json?id=${Math.random()}`);
    }
    else{
        worldData   = await fetchJson(`data/prod.json?id=${Math.random()}`);
    }

    if(worldData.target == undefined){
        throw new MyError();
    }

    // await loadWorld(worldData.target);
    // dumpObj(canvas, 0, new Set<any>());
    testEx();

    const map = await fetchJson(`data/map.json?id=${Math.random()}`);
    initIsometric(worldCanvas, map);
    worldCanvas.isReady = true;
}

export async function loadWorld(target : string){
    clearIsometric();

    const canvas : Canvas   = worldCanvas;
    const data   : JsonData = worldData;

    worldCanvas.isReady = false;

    SymbolRef.clearSymbolMap();
    canvas.clearUIs();
    ArithmeticView.arithmeticViews = [];
    termToUIs.clear();

    const stageData = await SymbolRef.importLibrary(target);

    if(data.imports != undefined){
        for(const path of data.imports){
            await SymbolRef.importLibrary(path);
        }
    }

    for(const obj of data.uis){
        const ui = makeUIFromJSON(obj);
        canvas.addUI(ui);
    }

    const root = new TreeNode({label:"root"});
    // makeTreeNodeFromObject(root, "canvas", canvas, new Set<any>());
    makeTreeNodeFromObject(root, "json", data, new Set<any>());

    if(isDev){
        const inspector = getUIFromId("inspector") as TreeNode;
        inspector.addChild(root);
    }

    canvas.layoutCanvas();

    initPopupMenus(stageData.menus);

    Sequencer.init(stageData.actions);

    worldCanvas.isReady = true;
}
export { worldCanvas };

