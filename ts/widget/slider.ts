namespace game_ts {
//

export interface Draggable {
    pointerdown(canvas : Canvas) : void;
    pointermove(canvas : Canvas) : void;
    pointerup(canvas : Canvas) : void;
}

class Thumb extends UI implements Draggable {
    static radius = 10;
    slider : Slider;
    value  : number = 0;

    constructor(slider : Slider){
        const data = {
            "className" : "Thumb",
            "size"      : [ 20, 40 ]
        } as UIAttr;

        super(data);
        this.slider = slider;
    }

    isNear(position : Vec2) : boolean {
        return Math.hypot(position.x - this.position.x, position.y - this.position.y) <= Thumb.radius;
    }

    setPositionByValue() {
        const ratio   = (this.value - this.slider.min) / (this.slider.max - this.slider.min);

        const thumbStart = this.slider.thumbStart();
        const thumbEnd   = this.slider.thumbEnd();

        this.position.x = thumbStart.x * (1 - ratio) + thumbEnd.x * ratio;
        this.position.y = thumbStart.y;
    }

    setPosition(position : Vec2) {
        const thumbStart = this.slider.thumbStart();
        const thumbEnd   = this.slider.thumbEnd();

        this.position.x = Math.max(thumbStart.x, Math.min(thumbEnd.x, position.x));
        this.position.y = thumbStart.y;

        const ratio   = (this.position.x - thumbStart.x) / (thumbEnd.x - thumbStart.x);
        this.value    = this.slider.min * (1 - ratio) + this.slider.max * ratio;
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void{
        const center = offset.add(this.position);

        ctx.beginPath();
        ctx.arc(center.x, center.y, Thumb.radius, 0, 2 * Math.PI, true);

        ctx.fillStyle   = "silver";
        ctx.strokeStyle = "gray";

        ctx.fill();
        ctx.stroke();        
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
    static padding = 30;
    track : Track;
    thumb : Thumb;
    min   : number = 0;
    max   : number = 100;

    constructor(data : UIAttr){
        super(data);
        this.track = new Track(this);
        this.thumb = new Thumb(this);

        this.initTrack();
    }

    thumbStart() : Vec2 {
        const start_x = Slider.padding;
        const start_y = this.size.y / 2;

        return new Vec2(start_x, start_y);
    }

    thumbEnd() : Vec2 {
        const end_x   = this.size.x - Slider.padding;
        const end_y = this.size.y / 2;

        return new Vec2(end_x, end_y);
    }

    initTrack(){
        const thumbStart = this.thumbStart();
        const thumbEnd   = this.thumbEnd();

        const track_x = thumbStart.x;
        const track_y = thumbStart.y - Track.height / 2;

        const size_x = thumbEnd.x - thumbStart.x;
        this.track.layout(new Vec2(track_x, track_y), new Vec2(size_x, Track.height));
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
        this.thumb.setPositionByValue();
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        super.draw(ctx, offset);
        const offset2 = offset.add(this.position);
        this.track.draw(ctx, offset2);
        this.thumb.draw(ctx, offset2);
    }
}
}