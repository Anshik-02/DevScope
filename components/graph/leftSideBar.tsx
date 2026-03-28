"use client";
import { useState } from "react";

import {
  Search,
  Activity,
  Target,
  ChevronDown,
  ChevronRight,
  Network,
  Share2,
} from "lucide-react";
import { Node, Edge } from "reactflow";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const nodeColors: Record<string, string> = {
  folder: "#8b5cf6",
  api: "#ef4444",
  service: "#3b82f6",
  database: "#10b981",
  component: "#f59e0b",
  route: "#06b6d4",
  function: "#ec4899",
  other: "#94a3b8",
};

interface Props {
  nodes: Node[];
  edges: Edge[];
  activeRouteLabel: string;
  onSelectNode: (node: Node) => void;
  onOpenSearch: () => void;
  onResetView: () => void;
  onFitView: () => void;
  onClearSelection: () => void;
  selectedNodeId?: string;
}

export default function LeftSidebar({
  nodes,
  edges,
  activeRouteLabel,
  onSelectNode,
  onOpenSearch,
  onResetView,
  onFitView,
  onClearSelection,
  selectedNodeId,
}: Props) {
  const [isEntryCollapsed, setIsEntryCollapsed] = useState(false);
  const entryNodes = nodes.filter(
    (n) => n.data?.type === "api" || n.data?.type === "route"
  );

  const complexityLevel =
    nodes.length > 50 || edges.length > 100
      ? "Serious"
      : nodes.length > 20 || edges.length > 40
      ? "Moderate"
      : "Balanced";

  const complexityColor =
    nodes.length > 50 || edges.length > 100
      ? "bg-red-500 animate-pulse"
      : nodes.length > 20 || edges.length > 40
      ? "bg-amber-500"
      : "bg-emerald-500";


  const mostConnectedNode = [...nodes].sort((a, b) => {
    const aCount = edges.filter(e => e.source === a.id || e.target === a.id).length;
    const bCount = edges.filter(e => e.source === b.id || e.target === b.id).length;
    return bCount - aCount;
  })[0];

  const criticalNode = [...nodes]
    .filter(n => n.data?.type === "api" || n.data?.type === "route")
    .sort((a, b) => {
      const aOut = edges.filter(e => e.source === a.id).length;
      const bOut = edges.filter(e => e.source === b.id).length;
      return bOut - aOut;
    })[0];


  return (
    <aside className="w-[300px] border-r border-border bg-card/60 backdrop-blur-3xl flex flex-col z-50 overflow-hidden shadow-sm relative">
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Entry Points */}
      <div className="p-6 border-b border-border">
        <button
          onClick={() => setIsEntryCollapsed((prev) => !prev)}
          className="w-full text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center justify-between italic hover:text-foreground transition-colors"
        >
          Entry Points
          {isEntryCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>

        {!isEntryCollapsed && (
          <>
            {/* Actions */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onOpenSearch}
                    className="p-2 hover:bg-muted rounded-lg border border-border"
                  >
                    <Search size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Search nodes (Cmd+K)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onFitView}
                    className="p-2 hover:bg-muted rounded-lg border border-border"
                  >
                    <Target size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Fit view to all nodes</TooltipContent>
              </Tooltip>
            </div>

    
            <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto pr-2 pb-2">
              {entryNodes.map((n, index) => (
                <div key={n.id} className="flex flex-col">
                  <button
                    onClick={() => onSelectNode(n)}
                    title={`File: ${n.data?.label}\nType: ${n.data?.type || 'Unknown'}\nClick to view architecture routing.`}
                    className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      selectedNodeId === n.id
                        ? "bg-purple-500/10 border border-purple-500/30 ring-1 ring-purple-500/20 shadow-sm"
                        : "hover:bg-muted/80 border border-transparent hover:border-border/60 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300 ${
                        selectedNodeId === n.id
                          ? "scale-125 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                          : "group-hover:scale-110"
                      }`}
                      style={{
                        backgroundColor: nodeColors[n.data?.type as string] || nodeColors.other,
                      }}
                    />
                    <div className="flex flex-col items-start overflow-hidden flex-grow gap-0.5">
                      <span className="text-[12px] font-bold truncate w-full text-left text-foreground leading-tight">
                        {n.data?.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black truncate w-full text-left opacity-80 group-hover:opacity-100 transition-opacity">
                        {n.data?.type || "Entry"} Node
                      </span>
                    </div>
                  </button>

                  {/* Separator */}
                  {index < entryNodes.length - 1 && (
                    <div className="w-[85%] mx-auto h-[1px] bg-border/40 rounded-full my-1" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    
      <div className="p-6 flex-grow flex flex-col bg-muted/10 overflow-y-auto">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 italic">
          Strategic Analysis
        </h3>


        <div className="space-y-4 mb-8">

          <div className="p-4 bg-card/40 border border-border/50 rounded-2xl flex flex-col gap-2 group/stat hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-2 text-purple-500">
              <Activity size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Most Connected</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black italic truncate">{mostConnectedNode?.data?.label || "Calculating..."}</span>
              <span className="text-[9px] text-muted-foreground font-medium">Core architectural hub detected</span>
            </div>
          </div>

          <div className="p-4 bg-card/40 border border-border/50 rounded-2xl flex flex-col gap-2 group/stat hover:border-red-500/30 transition-all">
            <div className="flex items-center gap-2 text-red-500">
              <Target size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Critical Point</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black italic truncate">{criticalNode?.data?.label || "None Found"}</span>
              <span className="text-[9px] text-muted-foreground font-medium">Highest risk surface entry</span>
            </div>
          </div>
        </div>

        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 italic">
          System Metrics
        </h3>

        <div className="bg-card/40 backdrop-blur-sm rounded-[24px]  border border-border/50 mb-6 p-6 flex flex-col justify-center gap-6 relative group ">

          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-4 group/item">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-sm border border-purple-500/10 group-hover/item:scale-110 transition-transform">
              <Network size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black italic tracking-tighter">{nodes.length}</span>
              <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Total Nodes</span>
            </div>
          </div>

          <div className="flex items-center gap-4 group/item">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-500/10 group-hover/item:scale-110 transition-transform">
              <Share2 size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black italic tracking-tighter">{edges.length}</span>
              <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Flow Edges</span>
            </div>
          </div>
        </div>

        <div
          className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between group/card hover:border-purple-500/30 transition-all duration-300 pointer-events-none"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${complexityColor}`} />
            <span className="text-[11px] font-black italic">
              {complexityLevel} complexity
            </span>
          </div>

      
        </div>
      </div>
    </aside>
  );
}