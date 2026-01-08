///<reference path="../widget/grid.ts" />

namespace game_ts {
//
export class SingleDigitImage extends Grid {
    value : number;
    images : ImageUI[];
    labels : Label[] = [];

    constructor(data : { value : number }){
        const grid_data : GridAttr = Object.assign(
            {
                children : [],
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

export abstract class BasicArithmetic extends Grid {

}

export class SingleDigitArithmetic extends BasicArithmetic {    
}


}