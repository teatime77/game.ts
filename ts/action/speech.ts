namespace game_ts {
//
let voiceLanguageCode : string = "eng";
let languageRegion : string;
let cancelSpeechFlag : boolean = false;
let onSpeak : ((text : string) => void) | undefined;

const langCodeList : [string, string][] = [
    ["ara", "ar-EG"],
    ["chi", "zh-CN"],
    ["eng", "en-US"],
    ["fre", "fr-FR"],
    ["ger", "de-DE"],
    ["hin", "hi-IN"],
    ["ind", "id-ID"],
    ["jpn", "ja-JP"],
    ["kor", "ko-KR"],
    ["rus", "ru-RU"],
    ["spa", "es-ES"],
    ["por", "pt-PT"],
];


const voiceNamesDic : { [lang: string]: string[] } = {
    "ja-JP" : [
        "Microsoft Nanami Online (Natural) - Japanese (Japan)",
        "Google 日本語",
        "Microsoft Ayumi - Japanese (Japan)"
    ]
    ,
    "en-US" : [
        "Microsoft Ava Online (Natural) - English (United States)",
        "Google US English",
        "Microsoft Zira - English (United States)"
    ]
};


const langCodeMap = new Map<string, string>(langCodeList);

const voiceMap = new Map<string, SpeechSynthesisVoice[]>();

function setVoiceList(){
    const voices = Array.from(speechSynthesis.getVoices());
    if(voices.length == 0){
        msg("no voice");
        return;
    }

    for(const voice of voices){
        if(voice.lang == languageRegion){

            msg(`voice lang:[${voice.lang}] name:[${voice.name}]`);
        }

        let voice_lang = voice.lang.replaceAll("_", "-");
        const k = voice_lang.indexOf("-#");
        if(k != -1){
            voice_lang = voice_lang.substring(0, k);
            // msg(`lang:${voice.lang} => ${voice_lang}`);
        }

        if(voiceMap.get(voice_lang) == undefined){
            voiceMap.set(voice_lang, []);

            if(Array.from( langCodeMap.values() ).includes(voice_lang)){

                // msg(`voice lang:${voice_lang}`);
            }
        }

        voiceMap.get(voice_lang)!.push(voice);
    }
}


function getVoiceByLangCode(lang_code : string) : SpeechSynthesisVoice | undefined {
    languageRegion = langCodeMap.get(lang_code)!;
    if(languageRegion == undefined){
        throw new MyError(`unknown lang code:${lang_code}`);
    }

    const voices = voiceMap.get(languageRegion);
    if(voices == undefined){
        msg(`no voice for ${languageRegion}`);
        return undefined;
    }

    const default_names = voiceNamesDic[languageRegion];
    if(default_names != undefined){
        for(const name of default_names){
            const voice = voices.find(x => x.name == name);
            if(voice != undefined){
                return voice;
            }
        }
    }

    const natural_voice = voices.find(x => x.name.indexOf("Online (Natural)") != -1);
    if(natural_voice != undefined){
        return natural_voice;
    }

    return voices[0];
}

export function initSpeech(){
    if ('speechSynthesis' in window) {
        msg("このブラウザは音声合成に対応しています。🎉");

    }
    else {
        msg("このブラウザは音声合成に対応していません。😭");
    }    

    speechSynthesis.onvoiceschanged = function(){
        msg("voices changed 1");
        setVoiceList();
    };

    speechSynthesis.addEventListener("voiceschanged", (ev:Event)=>{
        setVoiceList();
        msg("voices changed 2");
    })

}


export abstract class AbstractSpeech extends Action {
    static one : AbstractSpeech;

    text!   : string;
    prevCharIndex = 0;
    speaking : boolean = false;

    callback : ((idx:number)=>void) | undefined;
    abstract speak(text : string) : Promise<void>;
    abstract waitEnd() : Promise<void>;
    abstract speak_waitEnd(text : string) : Promise<void>;


    onBoundary(ev: SpeechSynthesisEvent) : void {
        const text = this.text.substring(this.prevCharIndex, ev.charIndex).trim();
        if(ev.charIndex == 0){

            msg(`Speech start text:[${this.text}]`)
        }
        else{
    
            // msg(`Speech bdr: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${text}]`);
        }
        if(this.callback != undefined){
            this.callback(ev.charIndex);
        }

        this.prevCharIndex = ev.charIndex;
    }


    onEnd(ev: SpeechSynthesisEvent) : void {
        // msg(`Speech end: id:${this.id} idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${this.text.substring(this.prevCharIndex)}]`);
        if(this.callback != undefined){
            this.callback(this.text.length);
        }
        this.speaking = false;
    }
}

export class Speech extends AbstractSpeech {
    static maxId = 0;

    id     : number;
    voice? : SpeechSynthesisVoice;

    constructor(){ 
        super({ className : "Speech" } as ActionAttr);
        
        i18n_ts.AbstractSpeech.one = this;
        this.id = Speech.maxId++;

        this.initVoice();
    }

    initVoice(){
        if(voiceMap.size == 0){
            setVoiceList();
        }

        if(this.voice == undefined){

            this.voice = getVoiceByLangCode(voiceLanguageCode);
            if(this.voice != undefined){
                // msg(`use voice:${this.voice.name}`);
            }
        }
    }

    emulate(speech_id : number | undefined){
    }

    async speak(text : string) : Promise<void> {
        cancelSpeechFlag = false;

        this.text = text.trim();
        if(this.text == ""){

            this.speaking = false;
            return;
        }

        this.speaking = true;

        if(onSpeak != undefined){
            onSpeak(this.text);
        }

/*        
        if(speech_id != undefined){
            const ok = await playAudio(this, speech_id);
            if(ok){
                return;
            }
        }
*/

        this.initVoice();
        msg(`Speak ${this.id}[${this.text}] ${this.voice != undefined ? this.voice.name : "no voice"}`);

        this.prevCharIndex = 0;
    
        const uttr = new SpeechSynthesisUtterance(this.text.replaceAll("○", "マル").replaceAll("×", "バツ"));

        uttr.addEventListener("end", this.onEnd.bind(this));
        uttr.addEventListener("boundary", this.onBoundary.bind(this));
        uttr.addEventListener("mark", this.onMark.bind(this));
    
        //uttr.rate = 5.0;// parseFloat(speechRate.value);

        if(this.voice != undefined){

            uttr.voice = this.voice;
        }

        speechSynthesis.speak(uttr);
    }
    
    onMark(ev: SpeechSynthesisEvent) : void {
    }

    async waitEndNEW(){
        for(const i of range(100)){
            if(cancelSpeechFlag || ! this.speaking){
                break;
            }
            await sleep(10);
        }

        // msg(`wait end:${this.id}`);
    }

    waitEnd() : Promise<void> {
        return new Promise((resolve) => {
            const id = setInterval(()=>{
                if(cancelSpeechFlag || ! this.speaking){
                    clearInterval(id);
                    // msg(`wait end:${this.id}`);
                    resolve();
                }
            }, 10);
        });
    }

    async speak_waitEnd(text : string){
        await this.speak(text);
        await this.waitEnd();
    }
}

export class EmulationSpeech extends AbstractSpeech {
    async speak(text : string) : Promise<void>{
        let charIndex = 0;

        const id = setInterval(()=>{
            if(voiceLanguageCode == "jpn"){
                charIndex++;
            }
            else{

                charIndex = this.text.indexOf(" ", charIndex);
                if(charIndex == -1){
                    charIndex = this.text.length;
                }
                else{
                    charIndex++;
                }
            }

            const ev : any = {
                charIndex : charIndex,
            };

            this.onBoundary(ev as SpeechSynthesisEvent);

            if(this.text.length <= charIndex){
                this.onEnd(ev as SpeechSynthesisEvent);
                clearInterval(id);
            }
        }, 1);

    }

    async waitEnd() : Promise<void> {

    }

    async speak_waitEnd(text : string) : Promise<void> {

    }
}

}