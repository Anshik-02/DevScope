import * as React from "react";
import { Edge, Node, useEdgesState, useNodesState } from "reactflow";
import { MinimalNodeData } from "@/components/graph/MinimalNode";
// @ts-expect-error missing explicit module
import dagre from "dagre";
import getLayerLayoutedElements from "@/components/graph/layerLayout";

const nodeWidth = 250;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], rankdir: "LR" | "TB" = "LR") => {
  const isCustom = nodes.some(n => n.type === "custom");
  const width = isCustom ? 520 : 250;
  const height = isCustom ? 180 : 80;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir, 
    nodesep: isCustom ? 180 : 100, 
    ranksep: isCustom ? 420 : 350 
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });
};

export function useProgressiveGraph(onNodeToggle?: (id: string) => void) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<any>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [rawNodes, setRawNodes] = React.useState<Node[]>([]);
  const [rawEdges, setRawEdges] = React.useState<Edge[]>([]);

  const nodesRef = React.useRef<Node[]>(nodes);
  const edgesRef = React.useRef<Edge[]>(edges);
  const rawNodesRef = React.useRef<Node[]>([]);
  const rawEdgesRef = React.useRef<Edge[]>([]);

  React.useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  React.useEffect(() => { edgesRef.current = edges; }, [edges]);
  React.useEffect(() => { rawNodesRef.current = rawNodes; }, [rawNodes]);
  React.useEffect(() => { rawEdgesRef.current = rawEdges; }, [rawEdges]);

  const [selectedNode, setSelectedNode] = React.useState<Node<any> | null>(null);
  const [focusedNodeId, setFocusedNodeId] = React.useState<string | null>(null);
  const [sequenceIndex, setSequenceIndex] = React.useState(-1);
  const [aiText, setAiText] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  const complexSequenceIds = React.useRef<string[]>([]);

  // 1. Unified Toggle Logic (Expand/Collapse)
  const toggleNode = React.useCallback((nodeId: string) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    
    const parentNode = currentNodes.find(n => n.id === nodeId);
    if (!parentNode) return;

    if (parentNode.data?.isExpanded) {
      // --- COLLAPSE LOGIC ---
      const descendantIds = new Set<string>();
      const findDescendants = (id: string) => {
        currentEdges.forEach(e => {
          if (e.source === id && !descendantIds.has(e.target)) {
            descendantIds.add(e.target);
            findDescendants(e.target);
          }
        });
      };
      findDescendants(nodeId);

      const nextNodes = currentNodes
        .filter(n => !descendantIds.has(n.id))
        .map(n => n.id === nodeId ? { ...n, data: { ...n.data, isExpanded: false } } : n);
      
      const nextEdges = currentEdges.filter(e => !descendantIds.has(e.target) && !descendantIds.has(e.source) && e.source !== nodeId);
      
      const layoutedNodes = getLayoutedElements(nextNodes, nextEdges, "LR");
      setNodes(layoutedNodes);
      setEdges(nextEdges);
      return;
    }

    // --- EXPAND LOGIC ---
    if (onNodeToggle) onNodeToggle(nodeId);
    
    const rNodes = rawNodesRef.current;
    const rEdges = rawEdgesRef.current;
    const existingNodeIds = new Set(currentNodes.map(n => n.id));
    
    const relevantEdges = rEdges.filter(e => e.source === nodeId);
    const childIds = new Set(relevantEdges.map(e => e.target));
    const newChildren = rNodes.filter(n => childIds.has(n.id) && !existingNodeIds.has(n.id));

    const positionedChildren = newChildren.map((n) => ({
      ...n,
      type: "minimal",
      position: { x: 0, y: 0 },
      data: {
        ...n.data,
        onToggle: () => toggleNode(n.id)
      }
    }));

    const updatedNodes = currentNodes.map(n => 
      n.id === nodeId ? { ...n, data: { ...n.data, isExpanded: true } } : n
    );

    const mergedNodesBuffer = [...updatedNodes, ...positionedChildren];
    const parentChildrenEdges = relevantEdges.map(e => ({
      ...e,
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: "default",
      animated: true,
      style: { strokeWidth: 2, stroke: "#64748b" }
    }));

    const allVisibleIds = new Set(mergedNodesBuffer.map(n => n.id));
    const edgeSet = new Set(currentEdges.map(p => p.id));
    const validNewEdges = parentChildrenEdges.filter(e => !edgeSet.has(e.id) && allVisibleIds.has(e.source) && allVisibleIds.has(e.target));
    const nextEdges = [...currentEdges, ...validNewEdges];

    const physicsLayoutedNodes = getLayoutedElements(mergedNodesBuffer, nextEdges, "LR");
    setNodes(physicsLayoutedNodes);
    setEdges(nextEdges);
  }, [onNodeToggle, setNodes, setEdges]);

  // 2. Initialization logic
  const initializeGraph = React.useCallback((savedNodes: Node[], savedEdges: Edge[], view: "minimal" | "complex" = "minimal") => {
    // Basic nodes preparation
    const childMap = new Map<string, string[]>();
    savedEdges.forEach(e => {
      const children = childMap.get(e.source) || [];
      if (!children.includes(e.target)) children.push(e.target);
      childMap.set(e.source, children);
    });

    const cleanRawNodes = savedNodes.map(n => ({
        ...n,
        type: "minimal",
        data: {
          ...n.data,
          hasChildren: (childMap.get(n.id) || []).length > 0,
          isExpanded: false,
          onToggle: () => toggleNode(n.id)
        }
    }));

    // Identify Entry Nodes
    const incomingEdges = new Set(savedEdges.map(e => e.target));
    let entryNodes = cleanRawNodes.filter(n => !incomingEdges.has(n.id) && n.data?.type === "folder");
    if (entryNodes.length === 0) entryNodes = cleanRawNodes.filter(n => !incomingEdges.has(n.id)).slice(0, 10);

    // Create Synthetic ROOT node and edges
    const rootNode: Node<any> = {
        id: "SYSTEM_ROOT",
        type: "minimal",
        position: { x: 0, y: 0 },
        width: nodeWidth,
        height: nodeHeight,
        data: {
            label: "Application Root",
            type: "folder",
            hasChildren: entryNodes.length > 0,
            isExpanded: false,
            onToggle: () => toggleNode("SYSTEM_ROOT")
        }
    };

    const syntheticEdges: Edge[] = entryNodes.map(n => ({
        id: `SYSTEM_ROOT-${n.id}`,
        source: "SYSTEM_ROOT",
        target: n.id,
        type: "default",
        animated: true
    }));

    const finalRawNodes = [...cleanRawNodes, rootNode];
    const finalRawEdges = [...savedEdges, ...syntheticEdges];

    setRawNodes(finalRawNodes);
    setRawEdges(finalRawEdges);
    rawNodesRef.current = finalRawNodes;
    rawEdgesRef.current = finalRawEdges;

    if (view === "complex") {
        const { nodes: lNodes, edges: lEdges } = getLayerLayoutedElements(finalRawNodes, finalRawEdges, "LR");
        setNodes(lNodes);
        setEdges(lEdges);
        
        const ids = lNodes.map(n => n.id);
        complexSequenceIds.current = ids;
        setSequenceIndex(0);
        return;
    }

    const initialNodes = getLayoutedElements([rootNode], [], "LR");
    setNodes(initialNodes);
    setEdges([]);
  }, [toggleNode, setNodes, setEdges]);

  // 3. Batch Expander
  const autoExpandTopNodes = React.useCallback(() => {
    const currentNodes = nodesRef.current;
    if (currentNodes.length === 0 || rawEdgesRef.current.length === 0) return;
    
    const topEntryNodes = currentNodes.filter(n => n.data?.hasChildren && !n.data?.isExpanded).slice(0, 3);
    topEntryNodes.forEach(node => toggleNode(node.id));
  }, [toggleNode]);

  const setGraphView = React.useCallback((mode: "minimal" | "complex") => {
    const rNodes = rawNodesRef.current;
    const rEdges = rawEdgesRef.current;

    if (mode === "complex") {
      const { nodes: lNodes, edges: lEdges } = getLayerLayoutedElements(rNodes, rEdges);
      setNodes(lNodes);
      setEdges(lEdges);
      
      const ids = lNodes.map(n => n.id);
      complexSequenceIds.current = ids;
      setSequenceIndex(0);
      setFocusedNodeId(ids[0]);
    } else {
      setSequenceIndex(-1);
      complexSequenceIds.current = [];
      setFocusedNodeId(null);
      
      const rootNode = rNodes.find(n => n.id === "SYSTEM_ROOT");
      if (rootNode) {
          const layoutedRoot = getLayoutedElements([rootNode], [], "LR");
          setNodes(layoutedRoot);
          setEdges([]);
      }
    }
  }, [setNodes, setEdges, toggleNode]);

  // ... AI and Sequence logic remains clean ...
  const fetchAiSummary = React.useCallback(async (node: Node<any>) => {
    if (!node.data?.code) return;
    setAiLoading(true);
    setAiText("");
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: node.data.code }),
      });
      const data = await res.json();
      setAiText(data.output || data.message || "No summary available.");
    } catch (e) {
      setAiText("Failed to generate summary. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }, []);

  const nextSequence = React.useCallback(() => {
    const ids = complexSequenceIds.current;
    if (ids.length === 0) return;
    const nextIdx = Math.min(sequenceIndex + 1, ids.length - 1);
    setSequenceIndex(nextIdx);
    setFocusedNodeId(ids[nextIdx]);
  }, [sequenceIndex]);

  const prevSequence = React.useCallback(() => {
    const ids = complexSequenceIds.current;
    if (ids.length === 0) return;
    const prevIdx = Math.max(sequenceIndex - 1, 0);
    setSequenceIndex(prevIdx);
    setFocusedNodeId(ids[prevIdx]);
  }, [sequenceIndex]);

  const highlightedData = React.useMemo(() => {
    if (!focusedNodeId) return { highlightedNodes: new Set<string>(), highlightedEdges: new Set<string>() };
    
    const hNodes = new Set<string>([focusedNodeId]);
    const hEdges = new Set<string>();
    const rEdges = rawEdgesRef.current;

    const descendants = new Set<string>();
    const descendantEdges = new Set<string>();
    const dQueue = [focusedNodeId];
    while(dQueue.length > 0) {
      const curr = dQueue.shift()!;
      rEdges.forEach(e => {
        if (e.source === curr && !descendants.has(e.target)) {
          descendants.add(e.target);
          descendantEdges.add(e.id);
          descendantEdges.add(`${e.source}-${e.target}`);
          dQueue.push(e.target);
        }
      });
    }

    descendants.forEach(id => hNodes.add(id));
    descendantEdges.forEach(id => hEdges.add(id));

    return { highlightedNodes: hNodes, highlightedEdges: hEdges };
  }, [focusedNodeId]);

  const visibleNodes = React.useMemo(() => {
    if (!focusedNodeId) return nodes;
    return nodes.map(n => ({
        ...n,
        data: {
            ...n.data,
            highlighted: highlightedData.highlightedNodes.has(n.id)
        }
    }));
  }, [nodes, focusedNodeId, highlightedData]);

  const visibleEdges = React.useMemo(() => {
    if (!focusedNodeId) return edges;
    return edges.map(e => ({
        ...e,
        data: {
            ...e.data,
            highlighted: highlightedData.highlightedEdges.has(e.id) || highlightedData.highlightedEdges.has(`${e.source}-${e.target}`)
        }
    }));
  }, [edges, focusedNodeId, highlightedData]);

  return { nodes: visibleNodes, edges: visibleEdges, onNodesChange, onEdgesChange, initializeGraph, toggleNode, setGraphView, autoExpandTopNodes, selectedNode, setSelectedNode, aiText, aiLoading, fetchAiSummary, rawNodes, rawEdges, focusedNodeId, setFocusedNodeId, sequenceIndex, nextSequence, prevSequence, totalSequence: complexSequenceIds.current.length };
}
