namespace game_ts {
//

export class Star extends UI {
    velocity : Vec2 = Vec2.zero();

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        ctx.fillStyle = (this.backgroundColor != undefined ? this.backgroundColor : "yellow");

        ctx.beginPath();

        const radius1 = 30;
        const radius2 = 10;
        for(const idx of range(10)){
            const theta = Math.PI / 2 + 2 * Math.PI * idx / 10;

            const radius = (idx % 2 == 0 ? radius1 : radius2);
            // msg(`${idx} ${(180 * theta / Math.PI).to}`)

            const x = offset.x + this.position.x + radius * Math.cos(theta);
            const y = offset.y + this.position.y + radius * Math.sin(theta);
            
            if(idx == 0){
                ctx.moveTo(x, y);
            }
            else{
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();
    }
}

export class Firework extends UI {
    stars: Star[];
    startTime = Date.now();

    constructor(data : UIAttr & { numStars: number}) {
        super(data);
        const colors = [
            "#FF0000", "#00FF00", "#0000FF", 
            "#FFFF00", "#00FFFF", "#FF00FF", 
        ];

        this.stars = [];
        for(const _ of range(data.numStars)){
            
            const star = new Star({
                "position" : [this.position.x, this.position.y],
                "backgroundColor" : colors[Math.floor(6.0 * Math.random())]
            } as UIAttr);

            const vx = 3.0 * (Math.random() - 0.5);
            const vy = 3.0 * (Math.random() - 0.5);
            star.velocity = new Vec2(vx, vy);

            this.stars.push(star);
        }
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2) : void {
        for(const star of this.stars){
            star.draw(ctx, offset);
            star.position = star.position.add(star.velocity);
        }

        if(Date.now() - this.startTime < 1000){

            Canvas.requestUpdateCanvas();
        }
        else{
            msg("stop firework");
        }
    }
}
}