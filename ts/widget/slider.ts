namespace game_ts {
//

export interface Draggable {
    pointerdown(canvas : Canvas) : void;
    pointermove(canvas : Canvas) : void;
    pointerup(canvas : Canvas) : void;
}

class Thumb extends UI implements Draggable {
    slider : Slider;

    constructor(slider : Slider){
        const data = {
            "className" : "Thumb",
            "size"      : [ 20, 40 ]
        } as UIAttr;

        super(data);
        this.slider = slider;
    }

    pointerdown(canvas : Canvas) : void {

    }

    pointermove(canvas : Canvas) : void {

    }

    pointerup(canvas : Canvas) : void {

    }
}

class Track extends UI {
    static height = 10;

    slider : Slider;

    constructor(slider : Slider){
        const data = {
            "className" : "Track"
        } as UIAttr;

        super(data);
        this.slider = slider;
    }
}


export class Slider extends UI {
    track : Track;
    thumb : Thumb;

    constructor(data : UIAttr){
        super(data);
        this.track = new Track(this);
        this.thumb = new Thumb(this);

        this.initTrack();
    }

    initTrack(){
        const track_y = (this.size.y - Track.height) / 2;
        this.track.layout(new Vec2(0, track_y), new Vec2(this.size.x, Track.height));
    }

    getNearUI(position : Vec2) : UI | undefined {
        const position2 = position.sub(this.position);
        if(this.thumb.isNear(position2)){
            return this.thumb;
        }

        if(this.isNear(position)){
            return this;
        }

        return undefined;
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);
        this.initTrack();
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        super.draw(ctx, offset);
        const offset2 = offset.add(this.position);
        this.track.draw(ctx, offset2);
        this.thumb.draw(ctx, offset2);
    }
}
}