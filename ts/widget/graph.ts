///<reference path="core.ts" />
declare const dagre: any;

namespace game_ts {
//
// 1. ノードの基本定義
interface GraphNodeAttr {
    id: string;
    label: string;
    // クラスターの場合、このIDが他のノードのparentIdになる
    isCluster?: boolean;
    // 親ノードのID。undefinedならルート階層
    parentId?: string;
}

class GraphNode {
    id!: string;
    label!: string;
    width?: number;
    height?: number;

    // クラスターの場合、このIDが他のノードのparentIdになる
    isCluster: boolean = false;
    // 親ノードのID。undefinedならルート階層
    parentId?: string;

    constructor(data : GraphNodeAttr){
        Object.assign(this, data);
    }
}

// 2. エッジの定義
interface GraphEdgeAttr {
    source: string;
    target: string;
    label?: string;
}

// 2. エッジの定義
class GraphEdge {
    source!: string;
    target!: string;
    label?: string;

    constructor(data : GraphEdgeAttr){
        Object.assign(this, data);
    }
}

export function makeGraph(obj : UIAttr) : Graph {
    const data  = obj as UIAttr & { nodes:GraphNodeAttr[], edges:GraphEdgeAttr[] };
    const nodes = data.nodes.map(x => new GraphNode(x));
    const edges = data.edges.map(x => new GraphEdge(x));
    const graph = new Graph(data, nodes, edges);

    return graph;
}

export class Graph extends ContainerUI {
    nodes: GraphNode[];
    edges: GraphEdge[];
    g : any;

    constructor(data : UIAttr, nodes: GraphNode[], edges: GraphEdge[]){
        super(data);

        this.nodes = nodes;
        this.edges = edges;

        // 1. グラフの初期化と設定
        this.g = new dagre.graphlib.Graph({ compound: true });
        // グラフ全体のレイアウト方向などを設定
        this.g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 50 });
        this.g.setDefaultEdgeLabel(() => ({}));

        this.initGraph();
    }

    initGraph(){
        for(const node of this.nodes){
            if(node.isCluster){

                this.g.setNode(node.id, { label: node.label, clusterLabelPos: 'top' });
            }
            else{
                if(node.width == undefined){
                    const font = `${Canvas.fontSize} ${Canvas.fontFamily}`;
                    const size = getTextBoxSize(worldCanvas.ctx, node.label, font);

                    node.width  = size.width;
                    node.height = size.height;
                }

                // this.g.setNode(node.id, { label: node.label, width: node.width, height: node.height });
                this.g.setNode(node.id, { label: node.label, width: node.width, height: node.height });
            }

            if(node.parentId != undefined){
                this.g.setParent(node.id, node.parentId);
            }
        }

        for(const edge of this.edges){
            this.g.setEdge(edge.source, edge.target);
        }
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
            // ctx.fillRect(x, y, node.width, node.height);
            ctx.strokeRect(x, y, node.width, node.height);

            // テキストの描画
            ctx.fillStyle = "#333";
            ctx.fillText(node.label as string, node.x, node.y);
        });

        ctx.restore();
    }
}

}