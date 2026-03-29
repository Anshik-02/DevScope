"use client";
import { useTheme } from "next-themes";

import {
  FileCode,
  FolderTree,
  Zap,
  ChevronRight,
  Activity,
  Cpu,
  Sparkles,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Edge, Node } from "reactflow";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];

  isTracing: boolean;

  onClose: () => void;
  onTrace: () => void;
  onSelectNode: (node: Node) => void;
  onAskAI: () => void;
  onDeepAsk: () => void;

  aiText: string;
  aiLoading: boolean;
  isOpen?: boolean;
  setIsOpen?: (v: boolean) => void;
}

const nodeColors: Record<string, string> = {
  folder: "#8B5CF6",
  api: "#10B981",
  service: "#3B82F6",
  database: "#F59E0B",
  component: "#EC4899",
  route: "#10B981",
  function: "#EC4899",
  other: "#94A3B8",
};

export default function NodeDetailsPanel({
  selectedNode,
  edges,
  nodes,
  isTracing,
  onClose,
  onTrace,
  onSelectNode,
  onAskAI,
  onDeepAsk,
  aiText,
  aiLoading,
  isOpen,
  setIsOpen,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  if (!selectedNode) return null;

  const outboundEdges = edges.filter((e) => e.source === selectedNode.id);
  const color = nodeColors[selectedNode.data?.type] || "#888";

  return (
    <aside className={`fixed md:relative inset-y-0 right-0 w-[90%] sm:w-[420px] md:w-[380px] border-l border-border flex flex-col z-[80] md:z-50 shadow-2xl md:shadow-sm transition-all duration-500 ease-in-out ${
      isOpen ? "translate-x-0 opacity-100" : "translate-x-full md:translate-x-0 opacity-0 md:opacity-100"
    } ${
      isDark ? "bg-card/70 backdrop-blur-3xl" : "bg-card/95 backdrop-blur-2xl"
    }`}>
      <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b pointer-events-none ${
        isDark ? "from-purple-500/[0.05] to-transparent" : "from-purple-500/[0.08] to-transparent"
      }`} />

      {/* ─── HEADER ─── */}
      <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-foreground text-background rounded-2xl shadow-xl rotate-3">
            <FileCode size={18} />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase italic tracking-wider">
              Node Analytics
            </h3>
            <span className="text-[9px] text-muted-foreground">
              System Discovery Engine
            </span>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                onClose();
                if (setIsOpen) setIsOpen(false);
              }}
              className="p-2 hover:bg-muted rounded-xl transition"
            >
              <X size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Close panel (Esc)</TooltipContent>
        </Tooltip>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="flex-grow overflow-y-auto p-6 space-y-8">

        {/* NODE HEADER */}
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-4 flex items-center gap-2 italic">
            <FolderTree size={12} className="text-purple-400" />
            {selectedNode.data?.label}
          </h4>

          <div className={`p-5 rounded-3xl border transition-all group relative overflow-hidden ${
            isDark ? "bg-muted/40 border-border hover:border-purple-400/40" : "bg-muted/20 border-border/60 hover:border-purple-400/30 shadow-sm"
          }`}>
            
            {/* glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition ${
              isDark ? "bg-purple-500/20" : "bg-purple-500/10"
            }`} />

            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-4 h-4 rounded-xl shadow-lg"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] font-black uppercase italic">
                {selectedNode.data?.type}
              </span>
            </div>

            <p className="text-[12px] text-muted-foreground italic leading-relaxed">
              {selectedNode.data?.type === "route"
                ? "Primary entry point handling external requests."
                : selectedNode.data?.type === "service"
                ? "Encapsulates business logic & orchestration."
                : "Represents modular logic unit in architecture."}
            </p>
          </div>
        </div>

        {/* TRACE BUTTON */}
        <button
          onClick={onTrace}
          className={`w-full flex items-center justify-between p-5 bg-foreground text-background rounded-2xl transition-all shadow-xl group relative overflow-hidden ${
            isTracing ? "ring-4 ring-purple-500/50" : ""
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition" />

          <div className="flex items-center gap-3 relative z-10">
            <Zap
              size={18}
              className={`text-purple-400 ${
                isTracing ? "animate-bounce" : "animate-pulse"
              }`}
            />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Trace Execution Flow
            </span>
          </div>

          <ChevronRight size={16} className="opacity-60" />
        </button>

        {/* OUTBOUND */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
              Outbound
            </h3>
            <span className="text-[10px] bg-muted px-2 py-1 rounded-full">
              {outboundEdges.length}
            </span>
          </div>

          <div className="space-y-3">
            {outboundEdges.map((e, idx) => {
              const target = nodes.find((n) => n.id === e.target);

              return (
                <div
                  key={idx}
                  onClick={() => target && onSelectNode(target)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                    isDark ? "bg-muted/30 border-border hover:border-purple-400 hover:bg-card" : "bg-muted/10 border-border/60 hover:border-purple-400/50 hover:bg-card hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-xl flex items-center justify-center group-hover:bg-purple-500/10">
                      <ArrowUpRight size={14} />
                    </div>
                    <span className="text-[12px] font-black truncate italic">
                      {target?.data?.label}
                    </span>
                  </div>

                  <ChevronRight size={12} className="opacity-60" />
                </div>
              );
            })}

            {outboundEdges.length === 0 && (
              <div className="p-6 border-2 border-dashed border-border rounded-3xl text-center text-[10px] text-muted-foreground italic">
                No downstream nodes
              </div>
            )}
          </div>
        </div>

        {/* AI SUMMARY */}
        {(aiText || aiLoading) && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-muted-foreground italic">
              Neural Summary
            </h3>

            {aiLoading ? (
              <div className="p-5 bg-muted/30 rounded-2xl animate-pulse" />
            ) : (
              <div className="p-5 bg-muted/30 rounded-2xl border border-border text-[12px] italic leading-relaxed">
                {aiText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t border-border bg-muted/20">
        <div className="flex flex-col gap-3">
          {selectedNode.data?.type !== "folder" && (
            <>
              <button
                onClick={onDeepAsk}
                className="w-full py-3 bg-card border border-border rounded-xl text-[11px] font-black hover:bg-muted transition flex items-center justify-center gap-2"
              >
                <Cpu size={14} /> Ask AI about your query
              </button>

              <button
                onClick={onAskAI}
                className="w-full py-4 bg-purple-600 text-white rounded-xl text-[13px] font-black hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Sparkles size={16} /> AI Summary
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}