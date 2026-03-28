// @ts-expect-error - dagre types missing
import dagre from "dagre";
import { Edge, Node, Position } from "reactflow";

const nodeHeight = 600;
const nodeWidth=520;



export default function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 140,
    ranksep: 220,
    edgesep: 100,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const sortedNodeIds = [...nodes]
    .sort((a, b) => {
      const ay = dagreGraph.node(a.id).y;
      const by = dagreGraph.node(b.id).y;
      if (ay !== by) return ay - by;
      return dagreGraph.node(a.id).x - dagreGraph.node(b.id).x;
    })
    .map((n) => n.id);

  return {
    nodes: nodes.map((node) => {
      const pos= dagreGraph.node(node.id);
      const sequence = sortedNodeIds.indexOf(node.id) + 1;
      return {
        ...node,
        type: "custom",
        data: { ...node.data, sequence },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        position: {
          x: pos.x - nodeWidth  / 2,
          y: pos.y - nodeHeight / 2,
        },
      };
    }),
  edges: edges.map((e, index) => ({
  ...e,
  id: e.id || `${e.source}-${e.target}-${index}`, 
  type: "default",
}))
  };
}