///<reference path="../../widget/grid.ts" />
///<reference path="../../widget/text.ts" />

namespace game_ts {
//
const gap = 10;

export class SingleDigitImage extends Grid {
    value : number;
    images : ImageUI[];
    labels : Label[] = [];

    constructor(data : { value : number }){
        const grid_data : GridAttr = Object.assign(
            {
                columns  : Grid.autoSize(data.value),
                rows     : "* *"
            }
            , 
            data
        );

        super(grid_data);

        this.images = range(data.value).map(x => new ImageUI({ imageFile : "banana.png", size : [ 60, 60 ]}));
        this.labels = range(data.value).map(i => new Label({ text : `${i + 1}`, size : [ 60, 60 ]}));

        this.addChildren(...this.images);
        this.addChildren(...this.labels);


        this.setRowColIdxOfChildren();

        this.value = data.value;
    }
}

export class ImageGrid10 extends ContainerUI {
    cellSize : Vec2 = Vec2.fromXY(30, 30);
    value : number = 10;
    images : ImageUI[];

    constructor(data : UIAttr & { value? : number } ){
        super(data);

        if(data.value != undefined){
            this.value = data.value;
        }
        const imageFile = (data.imageFile != undefined ? data.imageFile : "banana.png");
        this.images = range(this.value).map(x => new ImageUI({ imageFile, size : [ this.cellSize.x, this.cellSize.y ], borderWidth:0, padding : 0}));
        this.addChildren(...this.images);
    }

    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());

        const width  = 5 * this.cellSize.x;
        const height = 2 * this.cellSize.y;

        this.setMinSizeFromContentSize(width, height);
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        let x : number;
        let y : number;
        for(const [idx, image] of this.images.entries()){
            if(idx <= 4){
                x = idx * this.cellSize.x;
                y = 0;
            }
            else{

                x = (idx - 5) * this.cellSize.x;
                y = this.cellSize.y;
            }

            image.layoutXY(x, y);
        }
    }
}


export class BundleImage extends ContainerUI {
    value  : number;
    tens : ImageGrid10[] = [];
    unit : ImageGrid10 | undefined;

    constructor(data : UIAttr & { value : number }){
        super(data);

        this.value = data.value;

        const unit_count = this.value % 10;
        const tens_count = (this.value - unit_count) / 10;

        if(tens_count != 0){
            this.tens = range(tens_count).map(x => new ImageGrid10({}));
            this.addChildren(...this.tens);
        }

        if(unit_count != 0){
            this.unit = new ImageGrid10({value : unit_count});
            this.addChildren(this.unit);
        }
    }


    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());

        let width  : number = 0;
        let height : number = 0;

        if(this.children.length != 0){

            if(this.tens.length != 0){
                width = this.tens[0].size.x;
                height = this.tens.length * this.tens[0].size.y;
            }
        }

        if(this.unit != undefined){
            if(this.tens.length != 0){
                width += gap;
            }

            width += this.unit.size.x;
            height = Math.max(height, this.unit.size.y);
        }

        this.setMinSizeFromContentSize(width, height);
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        const base = Vec2.zero();
        if(this.minSize.x <= size.x && this.minSize.y <= size.y){
            base.setXY((size.x - this.minSize.x) / 2, (size.y - this.minSize.y) / 2);
            // msg(`bundle image:${this.minSize} ${size} ${base}`);
        }
        for(const [idx, ten] of this.tens.entries()){
            ten.setPosition(Vec2.fromXY(0, idx * this.tens[0].size.y).add(base));
        }

        if(this.unit != undefined){

            const content_size = this.getContentSize();
            const x = (this.tens.length == 0 ? 0 : this.tens[0].size.x + gap);

            this.unit.setPosition(Vec2.fromXY(x, content_size.y - this.unit.size.y).sub(base));
        }

        this.children.forEach(x => x.updateLayout());
    }
}

export function makeImageViewFromApp(app : App) : Grid {
    assert(app.args.length == 2 && app.args.every(x => x instanceof ConstNum));

    const n1 = app.args[0].value.int();
    const n2 = app.args[1].value.int();

    const bundle_image1  = new BundleImage({ value : n1 });
    const operator_label = makeOperatorLabel(app.fncName);
    const bundle_image2  = new BundleImage({ value : n2 });

    const grid = new Grid({
        columns  : "* * *",
        rows     : "*",
        children : [
            bundle_image1,
            operator_label,
            bundle_image2
        ]
    });

    return grid;

}

export function makeImageViewFromTerm(term : Term) : Grid {
    if(term instanceof App){
        return makeImageViewFromApp(term);
    }

    throw new MyError();
}

}