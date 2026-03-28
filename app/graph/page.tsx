"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Node } from "reactflow";




const nodeColors = {
  folder: "#8b5cf6",
  api: "#ef4444",
  service: "#3b82f6",
  database: "#10b981",
  component: "#f59e0b",
  route: "#06b6d4",
  function: "#ec4899",
  other: "#94a3b8",
};

const nodeTypes = { custom: CustomNode };
const edgeTypes = { default: HierarchyEdge };

// import { WelcomeToast } from "@/components/ui/toast";
import GraphCanvas from "@/components/graph/graphCanvas";
import CustomNode from "@/components/graph/customGraph";
import { HierarchyEdge } from "@/components/graph/heirarchyGraph";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGraph } from "@/hooks/useGraph";
import getLayoutedElements from "@/components/graph/layout";
import GraphHeader from "@/components/graph/graphHeader";
import SearchOverlay from "@/components/graph/searchOverlay";
import LeftSidebar from "@/components/graph/leftSideBar";
import NodeDetailsPanel from "@/components/graph/rightSideBar";
import GraphToolbar from "@/components/graph/graphToolbar";

export default function GraphPageWrapper() {
  return (
    <TooltipProvider>
      <ReactFlowProvider>
        <GraphPage />
      </ReactFlowProvider>
    </TooltipProvider>
  );
}

function GraphPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);


  }, []);
  const graph = useGraph();

  const [isTracing, setIsTracing] = useState(false);
  const [isAutoTracing, setIsAutoTracing] = useState(false);
  const autoTraceRef = useRef(false);
  const [traceIndex, setTraceIndex] = useState(-1);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const { setCenter, fitView } = useReactFlow();


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return [];
    return graph.nodes
      .filter((n) =>
        n.data.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice(0, 8);
  }, [graph.nodes, searchQuery]);


  useEffect(() => {
    const savedData = localStorage.getItem("graphData");
    if (!savedData) return;

    try {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);
      if (!savedNodes || !savedEdges) return;

      const uniqueNodes = Array.from(new Map(savedNodes.map((n: any) => [n.id, n])).values()) as any[];
      const uniqueEdges = Array.from(new Map(savedEdges.map((e: any) => [`${e.source}-${e.target}-${e.label}`, e])).values()) as any[];

      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(uniqueNodes, uniqueEdges);

      const visiting = new Set<string>();

      graph.setRawEdges(savedEdges);
      graph.setNodes(layoutedNodes);
      graph.setEdges(layoutedEdges);
      graph.setHighlightedPath(visiting);

      setTimeout(() => fitView({ duration: 1000, padding: 0.2 }), 300);
    } catch (e) {
      console.error("Error loading graph", e);
    }
  }, [fitView]);

  const flowColorMode = mounted
    ? theme === "dark"
      ? "dark"
      : "light"
    : undefined;

  const dotColor = theme === "dark" ? "#334155" : "#cbd5e1";

  const orderedFileNodes = useMemo(
    () =>
      [...graph.nodes]
        .sort(
          (a: Node<any>, b: Node<any>) =>
            (((a.data as any)?.sequence ?? Number.MAX_SAFE_INTEGER) -
              ((b.data as any)?.sequence ?? Number.MAX_SAFE_INTEGER)) ||
            ((a.data as any)?.label || "").localeCompare((b.data as any)?.label || "")
        ),
    [graph.nodes]
  );

  const focusNodeAt = (index: number) => {
    if (index < 0 || index >= orderedFileNodes.length) return;
    setTraceIndex(index);
    const node = orderedFileNodes[index];
    graph.focusNode(node as any, setCenter);
  };

  const playAllTrace = async () => {
    if (isAutoTracing) {
      autoTraceRef.current = false;
      setIsAutoTracing(false);
      return;
    }

    if (orderedFileNodes.length === 0) return;

    autoTraceRef.current = true;
    setIsAutoTracing(true);
    for (let i = 0; i < orderedFileNodes.length; i++) {
      if (!autoTraceRef.current) break;
      focusNodeAt(i);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    autoTraceRef.current = false;
    setIsAutoTracing(false);
  };

  const goNextTrace = () => {
    if (orderedFileNodes.length === 0) return;
    const nextIndex = traceIndex < 0 ? 0 : Math.min(traceIndex + 1, orderedFileNodes.length - 1);
    focusNodeAt(nextIndex);
  };

  const goPrevTrace = () => {
    if (orderedFileNodes.length === 0) return;
    const prevIndex = traceIndex < 0 ? 0 : Math.max(traceIndex - 1, 0);
    focusNodeAt(prevIndex);
  };

  useEffect(() => {
    if (!graph.selectedNode) return;
    const idx = orderedFileNodes.findIndex((n) => n.id === graph.selectedNode?.id);
    if (idx >= 0) setTraceIndex(idx);
  }, [graph.selectedNode, orderedFileNodes]);

  const [repoName, setRepoName] = useState("");

  useEffect(() => {
    const savedRepoName = localStorage.getItem("repoName");
    if (savedRepoName) setRepoName(savedRepoName);
  }, []);

  return (
    <div className="w-full h-screen bg-background flex flex-col overflow-hidden relative font-sans text-foreground transition-colors duration-500">

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(168,85,247,0.03),transparent_50%),radial-gradient(circle at 100% 100%,rgba(99,102,241,0.03),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredNodes={filteredNodes}
        onSelectNode={(node) => graph.onNodeClick(node, setCenter)}
      />
      <GraphHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        nodeColors={nodeColors}
        onBack={() => router.push("/")}
        theme={theme}
        setTheme={setTheme}
        mounted={mounted}
      />

      <div className="flex-grow flex overflow-hidden">
        <LeftSidebar
          nodes={graph.nodes}
          edges={graph.edges}
          activeRouteLabel={graph.activeRouteLabel}
          onSelectNode={(node) => graph.onNodeClick(node, setCenter)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onResetView={() => {
            graph.setHighlightedPath(new Set());
            graph.setActiveRouteLabel("");
            fitView({ duration: 800 });
          }}
          onFitView={() => fitView({ duration: 800 })}
          onClearSelection={() => graph.setSelectedNode(null)}
          selectedNodeId={graph.selectedNode?.id}
        />

        <main className="flex-grow flex flex-col relative bg-background">
          <GraphToolbar
            activeRouteLabel={graph.activeRouteLabel}
            selectedNode={graph.selectedNode}
            isPlaying={isAutoTracing}
            canGoPrev={traceIndex > 0}
            canGoNext={orderedFileNodes.length > 0 && traceIndex < orderedFileNodes.length - 1}
            traceProgressLabel={
              orderedFileNodes.length === 0
                ? "0 / 0"
                : `${Math.max(traceIndex + 1, 0)} / ${orderedFileNodes.length}`
            }
            onNew={() => router.push("/")}
            onReset={() => {
              autoTraceRef.current = false;
              setIsAutoTracing(false);
              setTraceIndex(-1);
              graph.setHighlightedPath(new Set());
              graph.setActiveRouteLabel("");
              fitView({ duration: 800 });
            }}
            onPlayAll={playAllTrace}
            onPrev={goPrevTrace}
            onNext={goNextTrace}
          />
          <GraphCanvas
            graph={graph}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            flowColorMode={flowColorMode}
            dotColor={dotColor}
            setCenter={setCenter}
            router={router}
            repoName={repoName}
          />
        </main>

        <NodeDetailsPanel
          selectedNode={graph.selectedNode}
          edges={graph.edges}
          nodes={graph.nodes}
          isTracing={isTracing}
          aiText={graph.aiText}
          aiLoading={graph.aiLoading}
          onClose={() => graph.setSelectedNode(null)}
          onTrace={() => {
            setIsTracing(true);
            setTimeout(() => setIsTracing(false), 2000);

            if (graph.selectedNode) {
              graph.onNodeClick(graph.selectedNode, setCenter);
            }
          }}
          onSelectNode={(node) => graph.onNodeClick(node, setCenter)}
          onAskAI={() => {
            if (graph.selectedNode) {
              graph.fetchAiSummary(graph.selectedNode);
            }
          }}
        />
      </div>

    </div>
  );
}