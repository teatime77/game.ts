///<reference path="container.ts" />

namespace game_ts {
//
export class Stage extends ContainerUI {
    static mainStage : Stage;

    constructor(data : UIAttr & { children? : any[] }){
        super(data);
        if(this.name == "main-stage"){
            Stage.mainStage = this;
        }
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);
        this.children.forEach(x => x.layout(x.position, x.size));
    }    
}
}