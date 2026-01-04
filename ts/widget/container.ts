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
            const content_position = this.getContentPosition();
            const position2 = position.sub(this.position).sub(content_position);

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

        const content_position = this.getContentPosition();
        const offset2 = offset.add(this.position).add(content_position);

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
    columnsPix : number[] = [];
    rowsPix    : number[] = [];

    constructor(data : UIAttr & { children : any[], columns?: string, rows? : string }) {
        super(data);
        if(data.columns !== undefined){

            this.columns = data.columns.split(" ");

            this.numCols = this.columns.length;
        }
        else{
            this.columns = ["*"];
            this.numCols = 1;
        }

        this.setRowColIdxOfChildren();

        if(data.rows !== undefined){

            this.rows = data.rows.split(" ");
            this.numRows = this.rows.length;
        }
        else{
            this.numRows = Math.max(... this.children.map(x => x.rowIdx + x.getRowSpan()));
            this.rows    = new Array(this.numRows).fill("*");
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

    static minTotalSize(columns : string[], pix_sum : number, min_size : number) : number {
        const ratio_columns = columns.filter(x => x.endsWith("%"));
        if(ratio_columns.length == 0){
            return 0;
        }

        const ratio_sum = Grid.ratioSum(ratio_columns);

        if(min_size < pix_sum){
            return 0;
        }

        const ratio_pix = min_size - pix_sum;

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

    getColumnsPix(){
        const pix_columns = new Array(this.numCols).fill(0) as number[];

        for(const [col_idx, col] of this.columns.entries()){
            if(col.endsWith("px")){
                pix_columns[col_idx] = Grid.pix(col);
            }
            else if(col == "*"){
                assert(!this.children.some(x => x.colSpan != undefined && 1 < x.colSpan && x.colIdx <= col_idx && col_idx < x.colIdx + x.colSpan));
                const col_children = this.children.filter(x => x.colIdx == col_idx);
                pix_columns[col_idx] = Math.max(...col_children.map(x => x.minSize.x));
            }
        }

        return pix_columns;
    }

    getRowsPix(){
        const pix_rows = new Array(this.numRows).fill(0) as number[];

        for(const [row_idx, row] of this.rows.entries()){
            if(row.endsWith("px")){
                pix_rows[row_idx] = Grid.pix(row);
            }
            else if(row == "*"){
                assert(!this.children.some(x => x.rowSpan != undefined && 1 < x.rowSpan && x.rowIdx <= row_idx && row_idx < x.rowIdx + x.rowSpan));
                const row_children = this.children.filter(x => x.rowIdx == row_idx);
                pix_rows[row_idx] = Math.max(...row_children.map(x => x.minSize.x));
            }
        }

        return pix_rows;
    }

    setMinSize() : void {
        assert(!isNaN(this.numCols) && !isNaN(this.numRows));
        if(this instanceof PopupMenu){
            msg("");
        }


        this.children.forEach(x => x.setMinSize());

        if(this.fixedSize !== undefined){

            this.minSize.copyFrom(this.fixedSize);
        }
        else{

            const padding_border_size = this.getPaddingBorderSize();

            let max_grid_ratio_width  = 0;
            let max_grid_ratio_height = 0;

            this.columnsPix = this.getColumnsPix();
            this.rowsPix    = this.getRowsPix();

            for(const child of this.children){
                const columns = this.columns.slice(child.colIdx, child.colIdx + child.getColSpan());
                const pix_col_sum = sum(this.columnsPix.slice(child.colIdx, child.colIdx + child.getColSpan()));
                max_grid_ratio_width = Math.max(max_grid_ratio_width, Grid.minTotalSize(columns, pix_col_sum, child.minSize.x));

                const rows = this.rows.slice(child.rowIdx, child.rowIdx + child.getRowSpan());
                const pix_row_sum = sum(this.rowsPix.slice(child.rowIdx, child.rowIdx + child.getRowSpan()));
                max_grid_ratio_height = Math.max(max_grid_ratio_height, Grid.minTotalSize(rows, pix_row_sum, child.minSize.y));
            }

            const grid_pix_width  = sum(this.columnsPix);
            const grid_pix_height = sum(this.rowsPix);

            this.minSize.x = grid_pix_width  + max_grid_ratio_width  + padding_border_size.x;
            this.minSize.y = grid_pix_height + max_grid_ratio_height + padding_border_size.y;
        }

        this.size.copyFrom(this.minSize);
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        const content_size = this.getContentSize();
        const columns_ratio_all = content_size.x - sum(this.columnsPix);
        const rows_ratio_all    = content_size.y - sum(this.rowsPix);
        assert(0 <= columns_ratio_all && 0 <= rows_ratio_all);
        const columns_pix = Array.from(this.columns.entries()).map(x => x[1].endsWith("%") ? Grid.ratio(x[1]) * columns_ratio_all : this.columnsPix[x[0]]);
        const rows_pix    = Array.from(this.rows.entries()).map(x => x[1].endsWith("%") ? Grid.ratio(x[1]) * rows_ratio_all : this.rowsPix[x[0]]);

        const column_pos : number[] = [0];
        columns_pix.forEach(x => column_pos.push( last(column_pos) + x ));

        const row_pos : number[] = [0];
        rows_pix.forEach(x => row_pos.push( last(row_pos) + x ));

        for(const child of this.children){
            const x = column_pos[child.colIdx];
            const y = row_pos[child.rowIdx];

            const width  = sum(columns_pix.slice(child.colIdx, child.colIdx + child.getColSpan()));
            const height = sum(rows_pix.slice(child.rowIdx, child.rowIdx + child.getRowSpan()));

            child.layout(new Vec2(x, y), new Vec2(width, height));
        }
    }
}
}