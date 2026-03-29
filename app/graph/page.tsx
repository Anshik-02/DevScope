"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useReactFlow, ReactFlowProvider, ReactFlow, Background } from "reactflow";
import "reactflow/dist/style.css";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu } from "lucide-react";
import MinimalNode from "@/components/graph/MinimalNode";
import { useProgressiveGraph } from "@/hooks/useProgressiveGraph";
import { TooltipProvider } from "@/components/ui/tooltip";

// UI Components
import GraphHeader from "@/components/graph/graphHeader";
import LeftSidebar from "@/components/graph/leftSideBar";
import NodeDetailsPanel from "@/components/graph/rightSideBar";
import SearchOverlay from "@/components/graph/searchOverlay";
import CustomNode from "@/components/graph/CustomNode";
import HierarchyEdge from "@/components/graph/HierarchyEdge";
import OnboardingToast from "@/components/graph/OnboardingToast";

// Constants
const nodeTypes = { 
  minimal: MinimalNode,
  custom: CustomNode
};

const edgeTypes = {
  hierarchy: HierarchyEdge
};
const nodeWidth = 250;
const nodeHeight = 80;

const nodeColors: Record<string, string> = {
  folder: "#8B5CF6", // Violet
  api: "#10B981",    // Emerald
  service: "#3B82F6", // Blue
  database: "#F59E0B", // Amber
  component: "#EC4899", // Pink
  route: "#10B981",    // Emerald
  function: "#EC4899", // Pink
  other: "#94A3B8",    // Slate
};

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
  const router = useRouter();
  const { fitView, setCenter } = useReactFlow();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTracing, setIsTracing] = useState(false);
  const [trackingNodeId, setTrackingNodeId] = useState<string | null>(null);
  const [graphView, setGraphView] = useState<"minimal" | "complex">("minimal");
  const [repoName, setRepoName] = useState("DEVSCOPE");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const lastFocusedId = useRef<string | null>(null);

  // Minimal mode auto-trace state
  const [isAutoTracing, setIsAutoTracing] = useState(false);
  const [autoTraceIndex, setAutoTraceIndex] = useState(0);

  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    initializeGraph, 
    toggleNode,
    setGraphView: setHookGraphView,
    selectedNode,
    setSelectedNode,
    aiText,
    aiLoading,
    fetchAiSummary,
    rawNodes,
    rawEdges,
    focusedNodeId,
    setFocusedNodeId,
    sequenceIndex,
    nextSequence,
    prevSequence,
    totalSequence
  } = useProgressiveGraph((id: string) => setTrackingNodeId(id));

  useEffect(() => {
    setMounted(true);
    const savedData = localStorage.getItem("graphData");
    if (!savedData) return;
    
    try {
      const name = localStorage.getItem("repoName");
      if (name) setRepoName(name.toUpperCase());
      
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);
      if (savedNodes && savedEdges) {
        initializeGraph(savedNodes, savedEdges);
        // Instant hard-reset focus on root
        setTimeout(() => {
          fitView({ nodes: [{ id: "SYSTEM_ROOT" }], padding: 4, duration: 0 });
        }, 300);
      }
    } catch (e) {
      console.error("Failed to parse local storage graph data:", e);
    }
  }, []);

  // Robust Initial Centering Effect
  const initialCenterRef = useRef(0);
  useEffect(() => {
    if (nodes.length > 0 && initialCenterRef.current < 2) {
      initialCenterRef.current += 1;
      
      // Perform centering attempts
      const timer = setTimeout(() => {
        fitView({
          nodes: [{ id: 'SYSTEM_ROOT' }],
          padding: 2.5,
          duration: 1200
        });
      }, 800 * initialCenterRef.current);
      
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]);

  // History Actions
  const fetchHistory = useCallback(() => {
    try {
      const savedHistory = localStorage.getItem("devscope_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  }, []);

  const saveGraph = useCallback(() => {
    if (!nodes.length) return;
    
    try {
      const savedHistory = localStorage.getItem("devscope_history");
      let currentHistory = savedHistory ? JSON.parse(savedHistory) : [];
      
      const newState = {
        id: crypto.randomUUID(),
        repoName,
        nodes: rawNodes,
        edges: rawEdges,
        createdAt: new Date().toISOString()
      };

      // Keep only unique repos, move newest to top
      currentHistory = [newState, ...currentHistory.filter((h: any) => h.repoName !== repoName)].slice(0, 5);
      
      localStorage.setItem("devscope_history", JSON.stringify(currentHistory));
      localStorage.setItem("graphData", JSON.stringify({ nodes: rawNodes, edges: rawEdges }));
      localStorage.setItem("repoName", repoName);
      
      console.log("[LOCAL SAVE] State persisted to browser storage.");
    } catch (error) {
      console.error("[LOCAL SAVE] Failed:", error);
    }
  }, [nodes.length, repoName, rawNodes, rawEdges]);

  // Auto-save logic (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveGraph();
    }, 2000);
    return () => clearTimeout(timer);
  }, [nodes, saveGraph]);

  const loadGraphFromHistory = (id: string, name: string) => {
    try {
      const savedHistory = localStorage.getItem("devscope_history");
      if (!savedHistory) return;
      
      const currentHistory = JSON.parse(savedHistory);
      const graphEntry = currentHistory.find((h: any) => h.id === id);
      
      if (graphEntry) {
        setRepoName(name.toUpperCase());
        initializeGraph(graphEntry.nodes, graphEntry.edges);
        setIsHistoryOpen(false);
        setTimeout(() => fitView({ padding: 0.3, duration: 1000 }), 300);
      }
    } catch (error) {
      console.error("Failed to load history graph:", error);
    }
  };

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
    setTrackingNodeId(node.id); // Trigger surgical lock-on regardless of mode
    if (graphView === "complex") {
      setFocusedNodeId(node.id);
    }
    // On mobile, auto-open the right sidebar for details
    if (window.innerWidth < 768) {
      setIsRightSidebarOpen(true);
    }
  };

  const handleGraphViewChange = (view: "minimal" | "complex") => {
    setGraphView(view);
    setHookGraphView(view);
    // Give layout a moment to settle before fitting
    setTimeout(() => fitView({ padding: 0.3, duration: 1000 }), 100);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setSelectedNode(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedNode]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return [];
    return rawNodes.filter((n: any) =>
      n.data?.label?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, [rawNodes, searchQuery]);

  // Dedicated Pan/Focus Effect with surgical lock-on
  useEffect(() => {
    const focusTarget = focusedNodeId || trackingNodeId;
    if (!focusTarget) {
      lastFocusedId.current = null;
      return;
    }
    
    // Allow re-focus if it's a tracking event (expansion)
    if (focusTarget === lastFocusedId.current && !trackingNodeId) return;
    
    const mainNode = nodes.find((n: any) => n.id === focusTarget);
    if (mainNode) {
        lastFocusedId.current = focusTarget;
        
        let targetNodes = [mainNode];
        if (trackingNodeId) {
            const children = edges
                .filter((e: any) => e.source === trackingNodeId)
                .map((e: any) => nodes.find((n: any) => n.id === e.target))
                .filter((n: any) => n !== undefined) as any[];
            targetNodes = [mainNode, ...children];
        }

        // --- SURGICAL LOCKDOWN: Cinematic Pan to reveal right-side expansion ---
        const timer = setTimeout(() => {
            fitView({
                nodes: targetNodes,
                duration: 1000,
                padding: 0.5, // Increased padding to reveal context to the right
                maxZoom: 1.1,
            });
        }, 50);

        if (trackingNodeId) {
            const clearTimer = setTimeout(() => setTrackingNodeId(null), 1200);
            return () => {
                clearTimeout(timer);
                clearTimeout(clearTimer);
            };
        }
        return () => clearTimeout(timer);
    }
  }, [nodes, edges, trackingNodeId, focusedNodeId, fitView]);

  // Auto-Play: Complex mode steps through sequence
  useEffect(() => {
    if (!isPlaying) return;
    if (graphView !== "complex") return;

    const timer = setTimeout(() => {
      nextSequence();
    }, 4000);
    return () => clearTimeout(timer);
  }, [isPlaying, graphView, nextSequence]);

  // Auto-Trace: Minimal mode — cinematic walk through all visible nodes
  const visibleNodes = useMemo(() => nodes.filter((n: any) => !n.hidden), [nodes]);

  const goToTraceNode = useCallback((index: number, nodeList: any[]) => {
    if (!nodeList.length) return;
    const safeIndex = ((index % nodeList.length) + nodeList.length) % nodeList.length;
    const node = nodeList[safeIndex];
    if (!node) return;
    setAutoTraceIndex(safeIndex);
    setSelectedNode(node);
    setTrackingNodeId(node.id);

    // Auto-expand: if this node has children and they are not yet shown, expand it
    if (node.data?.hasChildren && !node.data?.isExpanded) {
      toggleNode(node.id);
    }

    fitView({
      nodes: [node],
      duration: 900,
      padding: 0.55,
      maxZoom: 1.2,
    });
  }, [fitView, setSelectedNode, toggleNode]);

  useEffect(() => {
    if (!isAutoTracing || graphView !== "minimal" || visibleNodes.length === 0) return;
    const timer = setTimeout(() => {
      const nextIndex = (autoTraceIndex + 1) % visibleNodes.length;
      goToTraceNode(nextIndex, visibleNodes);
    }, 3200);
    return () => clearTimeout(timer);
  }, [isAutoTracing, autoTraceIndex, visibleNodes, graphView, goToTraceNode]);

  return (
    <div className="w-full h-screen bg-background flex flex-col relative font-sans text-foreground overflow-hidden">
      <OnboardingToast />
      
      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredNodes={filteredNodes}
        onSelectNode={(node: any) => {
          setSelectedNode(node);
          const visibleNode = nodes.find((n: any) => n.id === node.id);
          if (visibleNode) {
            setCenter(visibleNode.position.x + nodeWidth/2, visibleNode.position.y + nodeHeight/2, { zoom: 0.8, duration: 800 });
          }
        }}
      />

      <GraphHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        nodeColors={nodeColors}
        onBack={() => router.push("/")}
        theme={theme}
        setTheme={setTheme}
        mounted={mounted}
        graphView={graphView}
        setGraphView={handleGraphViewChange}
        onOpenHistory={() => {
          fetchHistory();
          setIsHistoryOpen(true);
        }}
      />

      {/* Insight Bar */}
      <div className="h-10 border-b border-border bg-muted/20 backdrop-blur-md flex items-center px-4 sm:px-6 gap-3 sm:gap-6 z-50">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-600 tracking-tighter uppercase shrink-0">
            Global View
          </div>
          <span className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-widest opacity-60 hidden sm:inline">
            Insight:
          </span>
          <span className="text-[10px] font-black text-foreground italic uppercase tracking-widest truncate">
            {repoName.split('/').pop()} Architecture Overview
          </span>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {(isLeftSidebarOpen || isRightSidebarOpen) && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] md:hidden transition-opacity"
            onClick={() => {
              setIsLeftSidebarOpen(false);
              setIsRightSidebarOpen(false);
            }}
          />
        )}

        <LeftSidebar
          nodes={rawNodes}
          edges={rawEdges}
          isOpen={isLeftSidebarOpen}
          setIsOpen={setIsLeftSidebarOpen}
          activeRouteLabel={selectedNode?.data?.label || ""}
          onSelectNode={(node: any) => {
            setSelectedNode(node);
            const visibleNode = nodes.find((n: any) => n.id === node.id);
            if (visibleNode) {
               setCenter(visibleNode.position.x + nodeWidth/2, visibleNode.position.y + nodeHeight / 2, { zoom: 0.8, duration: 800 });
            }
            if (window.innerWidth < 1024) setIsLeftSidebarOpen(false);
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onResetView={() => fitView({ duration: 800 })}
          onFitView={() => fitView({ duration: 800 })}
          onClearSelection={() => setSelectedNode(null)}
          selectedNodeId={selectedNode?.id}
        />

        <main className="flex-grow flex flex-col relative bg-background border-r border-border/50 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(instance) => {
               // Hard reset to ensure SYSTEM_ROOT is found immediately
               instance.fitView({ nodes: [{ id: "SYSTEM_ROOT" }], padding: 5, duration: 0 });
            }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.05}
            maxZoom={2}
            className="z-10 bg-transparent"
          >
            <Background color={theme === "dark" ? "#334155" : "#e2e8f0"} gap={20} size={1} />
            
            {/* Mobile Sidebar Trigger */}
            <button 
              onClick={() => setIsLeftSidebarOpen(true)}
              className="absolute top-6 left-6 z-50 p-3 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Cinematic Background Title & Watermark */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden z-0">
               <h1 className="text-[60px] sm:text-[140px] font-black italic uppercase text-foreground/[0.03] dark:text-foreground/[0.07] tracking-[-0.08em] leading-none mb-2">
                 {repoName.split('/').pop()}
               </h1>
            </div>

            {/* ATMOSPHERIC LAYER 1: MESH GRADIENT */}
            <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px]" />
            </div>

            {/* ATMOSPHERIC LAYER 2: CENTER GLOW */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/[0.03] dark:bg-purple-500/[0.07] blur-[150px] rounded-full pointer-events-none" />
          </ReactFlow>

           {/* TRACE NAVIGATION OVERLAY (Complex Mode) */}
          {graphView === "complex" && (
            <div className="absolute bottom-4 sm:top-6 sm:bottom-auto left-1/2 sm:left-auto sm:right-6 -translate-x-1/2 sm:translate-x-0 z-[100] flex items-center justify-center gap-2 sm:gap-3 bg-card/70 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl max-w-[95vw]">
                <button 
                  onClick={prevSequence}
                  className="px-3 py-2 hover:bg-white/5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
                >
                  Prev
                </button>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  onClick={nextSequence}
                  className="px-3 py-2 hover:bg-white/5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
                >
                  Next
                </button>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2
                    ${isPlaying ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"}
                  `}
                >
                  {isPlaying ? "Stop" : "Play"}
                </button>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black tabular-nums tracking-tighter">
                   <span className="text-purple-500">{sequenceIndex + 1}</span>
                   <span className="opacity-30 mx-1">/</span>
                   <span className="opacity-60">{totalSequence}</span>
                </div>
            </div>
          )}

          {/* AUTO-TRACE OVERLAY (Minimal Mode) */}
          {graphView === "minimal" && visibleNodes.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 sm:gap-3 bg-card/70 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 shadow-2xl max-w-[95vw]">
              <button
                onClick={() => {
                  const newIndex = (autoTraceIndex - 1 + visibleNodes.length) % visibleNodes.length;
                  goToTraceNode(newIndex, visibleNodes);
                }}
                className="px-3 py-2 hover:bg-white/5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all"
              >
                Prev
              </button>
              <div className="h-4 w-px bg-white/10" />
              <button
                onClick={() => {
                  const newIndex = (autoTraceIndex + 1) % visibleNodes.length;
                  goToTraceNode(newIndex, visibleNodes);
                }}
                className="px-3 py-2 hover:bg-white/5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all"
              >
                Next
              </button>
              <div className="h-4 w-px bg-white/10" />
              <button
                onClick={() => {
                  if (isAutoTracing) {
                    setIsAutoTracing(false);
                  } else {
                    setIsAutoTracing(true);
                    goToTraceNode(autoTraceIndex, visibleNodes);
                  }
                }}
                className={`px-5 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${
                  isAutoTracing
                    ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                {isAutoTracing ? "Stop" : "Auto Trace"}
              </button>
              {isAutoTracing && (
                <>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="px-3 text-[10px] font-black tabular-nums tracking-tighter">
                    <span className="text-purple-400">{autoTraceIndex + 1}</span>
                    <span className="opacity-30 mx-1">/</span>
                    <span className="opacity-60">{visibleNodes.length}</span>
                  </div>
                </>
              )}
            </div>
          )}

        
        </main>

        <NodeDetailsPanel
          selectedNode={selectedNode as any}
          edges={rawEdges}
          nodes={rawNodes}
          isOpen={isRightSidebarOpen}
          setIsOpen={setIsRightSidebarOpen}
          isTracing={isTracing}
          onClose={() => {
            setSelectedNode(null);
            setIsRightSidebarOpen(false);
          }}
          onTrace={() => {
            setIsTracing(true);
            setTimeout(() => setIsTracing(false), 2000);
            if (selectedNode) {
              const visibleNode = nodes.find((n: any) => n.id === selectedNode.id);
              if (visibleNode) {
                setCenter(visibleNode.position.x + nodeWidth/2, visibleNode.position.y + nodeHeight/2, { zoom: 0.8, duration: 800 });
              }
            }
          }}
          onSelectNode={(node: any) => {
             setSelectedNode(node);
             const visibleNode = nodes.find((n: any) => n.id === node.id);
             if (visibleNode) {
               setCenter(visibleNode.position.x + nodeWidth/2, visibleNode.position.y + nodeHeight/2, { zoom: 0.8, duration: 800 });
             }
          }}
          onAskAI={() => {
            if (selectedNode) fetchAiSummary(selectedNode as any);
          }}
          aiText={aiText}
          aiLoading={aiLoading}
        />

        {/* History Drawer */}
        <aside className={`fixed top-0 right-0 h-full w-[85%] sm:w-[350px] bg-card/80 backdrop-blur-3xl border-l border-border z-[100] transform transition-transform duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${
          isHistoryOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          <div className="p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[12px] font-black uppercase italic tracking-widest text-foreground">Discovery History</h3>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">Last 5 Sessions</p>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl border border-white/10 transition-all"
              >
                <div className="w-4 h-px bg-foreground rotate-45 translate-y-[1px]" />
                <div className="w-4 h-px bg-foreground -rotate-45 translate-y-[-1px]" />
              </button>
            </div>

            <div className="flex-grow space-y-4">
              {history.length > 0 ? (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadGraphFromHistory(item.id, item.repoName)}
                    className="w-full group p-5 bg-white/[0.03] hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 rounded-2xl transition-all text-left flex flex-col gap-2 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black italic truncate w-48 uppercase tracking-tighter text-foreground group-hover:text-purple-400">
                        {item.repoName.split('/').pop()}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,1)]" />
                    </div>
                    <div className="flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-bold uppercase tracking-widest">{item.repoName}</span>
                      <span className="text-[8px] font-medium italic">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                  <p className="text-[10px] font-black uppercase tracking-widest">No Sessions Found</p>
                </div>
              )}
            </div>

            <div className="mt-8 p-6 bg-purple-500/5 rounded-2xl border border-purple-500/10">
               <p className="text-[9px] text-muted-foreground italic leading-relaxed">
                 Graph states are automatically persisted to your browser's local storage as you discover new architectural layers.
               </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}