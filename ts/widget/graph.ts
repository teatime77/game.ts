///<reference path="core.ts" />
declare const dagre: any;

namespace game_ts {
//
export class Graph extends ContainerUI {
    g : any;

    constructor(data : UIAttr & { children? : any[] }){
        super(data);

        // 1. グラフの初期化と設定
        this.g = new dagre.graphlib.Graph();
        // グラフ全体のレイアウト方向などを設定
        this.g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 50 });
        this.g.setDefaultEdgeLabel(() => ({}));

        this.initGraph();
    }

    initGraph(){

        // 2. ノードの追加 (ID, {ラベル, 幅, 高さ})
        const nodeWidth = 100;
        const nodeHeight = 40;

        this.g.setNode("n1", { label: "Start", width: nodeWidth, height: nodeHeight });
        this.g.setNode("n2", { label: "Process A", width: nodeWidth, height: nodeHeight });
        this.g.setNode("n3", { label: "Process B", width: nodeWidth, height: nodeHeight });
        this.g.setNode("n4", { label: "End", width: nodeWidth, height: nodeHeight });

        // 3. エッジ（線）の追加
        this.g.setEdge("n1", "n2");
        this.g.setEdge("n1", "n3");
        this.g.setEdge("n2", "n4");
        this.g.setEdge("n3", "n4");
    }

    layout(position : Vec2, size : Vec2) : void {
        super.layout(position, size);

        // 4. レイアウト計算の実行 (これで各要素に x, y が割り当てられる)
        dagre.layout(this.g);
    }

    draw(ctx : CanvasRenderingContext2D, offset : Vec2, visibleArea : VisibleArea | undefined) : void {
        ctx.save();

        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // エッジの描画
        this.g.edges().forEach((e:any) => {
            const edge = this.g.edge(e);
            const points = edge.points; // 折れ線の配列

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = "#999";
            ctx.stroke();

            // 簡易的な矢印の描画（終点）
            const last = points[points.length - 1];
            const prev = points[points.length - 2];
            const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(last.x - 10 * Math.cos(angle - Math.PI / 6), last.y - 10 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(last.x - 10 * Math.cos(angle + Math.PI / 6), last.y - 10 * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = "#999";
            ctx.fill();
        });

        // ノードの描画
        this.g.nodes().forEach((v:any) => {
            const node = this.g.node(v);
            const x = node.x - node.width / 2;
            const y = node.y - node.height / 2;

            // ボックスの描画
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, node.width, node.height);
            ctx.strokeRect(x, y, node.width, node.height);

            // テキストの描画
            ctx.fillStyle = "#333";
            ctx.fillText(node.label as string, node.x, node.y);
        });

        ctx.restore();
    }
}

}