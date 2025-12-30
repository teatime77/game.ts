///<reference path="core.ts" />

namespace game_ts {
//
export abstract class ContainerUI extends UI {
    children : UI[] = [];

    constructor(data : UIAttr & { children? : any[] }){
        super(data);

        if(data.children != undefined){
            this.children = (data.children as any[]).map(x => makeUIFromObj(x));
            this.children.forEach(x => x.parent = this);
        }
    }

    addChildren(...children : UI[]){
        this.children.push(...children);
        children.forEach(x => x.parent = this);
    }

    setMinSize() : void {
        this.children.forEach(x => x.setMinSize());
    }

    getNearUI(position : Vec2) : UI | undefined {
        if(this.isNear(position)){
            const position2 = position.sub(this.position);

            const ui = getNearUIinArray(this.children.slice().reverse(), position2);
            if(ui !== undefined){
                return ui;
            }

            return this;
        }

        return undefined;
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2, visibleArea : VisibleArea | undefined) : void {
        super.draw(ctx, offset, visibleArea);
        const offset2 = offset.add(this.position);

        if(this instanceof ScrollView){
            this.drawScrollView(ctx, offset2, visibleArea);
        }
        else{
            this.children.forEach(x => x.draw(ctx, offset2, visibleArea));
        }
    }
}

export class Grid extends ContainerUI {
    columns : string[];
    rows    : string[];
    numCols : number;
    numRows : number;

    constructor(data : UIAttr & { children : any[], columns?: string, rows? : string }) {
        super(data);
        if(data.columns !== undefined){

            this.columns = data.columns.split(" ");

            this.numCols = this.columns.length;
        }
        else{
            this.columns = ["100%"];
            this.numCols = 1;
        }

        this.setRowColIdxOfChildren();

        if(data.rows !== undefined){

            this.rows = data.rows.split(" ");
            this.numRows = this.rows.length;
        }
        else{
            this.numRows = Math.max(... this.children.map(x => x.rowIdx + x.getRowSpan()));
            this.rows    = new Array(this.numRows).fill("100%");
        }
    }

    static pix(s : string) : number {
        assert(s.endsWith("px"));
        return parseFloat(s.slice(0, -2));
    }

    static ratio(s: string) : number {
        assert(s.endsWith("%"));
        return parseFloat(s.slice(0, -1)) / 100;
    }

    static pixSum(pixes : string[]) : number {
        const pix_nums = pixes.map(x => Grid.pix(x));
        return i18n_ts.sum(pix_nums);
    }

    static ratioSum(ratioes : string[]) : number {
        const pix_nums = ratioes.map(x => Grid.ratio(x));
        return i18n_ts.sum(pix_nums);
    }

    static minTotalSize(columns : string[], min_size : number) : number {
        const ratio_columns = columns.filter(x => x.endsWith("%"));
        if(ratio_columns.length == 0){
            return 0;
        }

        const pix_columns = columns.filter(x => x.endsWith("px"));

        const ratio_sum = Grid.ratioSum(ratio_columns);

        const pix_sum = Grid.pixSum(pix_columns);

        const ratio_pix = min_size - pix_sum;
        assert(0 < ratio_pix);

        // grid-width * ratio_sum = ratio_pix
        return ratio_pix / ratio_sum;
    }

    setRowColIdxOfChildren(){
        let col_idx = 0;
        let row_idx = 0;
        for(const child of this.children){
            child.colIdx = col_idx;
            child.rowIdx = row_idx;

            col_idx += child.getColSpan();
            if(this.numCols <= col_idx){
                col_idx = 0;
                row_idx++;
            }
        }
    }

    setMinSize() : void {
        assert(!isNaN(this.numCols) && !isNaN(this.numRows));


        this.children.forEach(x => x.setMinSize());

        if(this.fixedSize !== undefined){

            this.minSize.copyFrom(this.fixedSize);
        }
        else{

            const padding_border_size = this.getPaddingBorderSize();

            let max_grid_ratio_width  = 0;
            let max_grid_ratio_height = 0;

            for(const child of this.children){
                const columns = this.columns.slice(child.colIdx, child.colIdx + child.getColSpan());
                max_grid_ratio_width = Math.max(max_grid_ratio_width, Grid.minTotalSize(columns, child.minSize.x));

                const rows = this.rows.slice(child.rowIdx, child.rowIdx + child.getRowSpan());
                max_grid_ratio_height = Math.max(max_grid_ratio_height, Grid.minTotalSize(rows, child.minSize.y));
            }

            const grid_pix_width  = Grid.pixSum( this.columns.filter(x => x.endsWith("px")) );
            const grid_pix_height = Grid.pixSum( this.rows.filter(x => x.endsWith("px")) );

            this.minSize.x = grid_pix_width  + max_grid_ratio_width  + padding_border_size.x;
            this.minSize.y = grid_pix_height + max_grid_ratio_height + padding_border_size.y;
        }

        this.size.copyFrom(this.minSize);
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        const column_pix = this.columns.map(x => (x.endsWith("px") ? Grid.pix(x) : Grid.ratio(x) * this.size.x )  );
        const row_pix    = this.rows.map(x => (x.endsWith("px") ? Grid.pix(x) : Grid.ratio(x) * this.size.y )  );

        const column_pos : number[] = [0];
        column_pix.forEach(x => column_pos.push( last(column_pos) + x ));

        const row_pos : number[] = [0];
        row_pix.forEach(x => row_pos.push( last(row_pos) + x ));


        for(const child of this.children){
            const x = column_pos[child.colIdx];
            const y = row_pos[child.rowIdx];

            const width  = sum(column_pix.slice(child.colIdx, child.colIdx + child.getColSpan()));
            const height = sum(row_pix.slice(child.rowIdx, child.rowIdx + child.getRowSpan()));

            child.layout(new Vec2(x, y), new Vec2(width, height));
        }
    }
}
}