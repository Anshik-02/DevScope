"use client";

import { Handle, Position, NodeProps } from "reactflow";
import {
  Database,
  Zap,
  Target,
  FolderTree,
  Braces,
  Boxes,
  Wrench,
  FileCode2,
  MousePointer2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const nodeColors: Record<string, string> = {
  folder:    "#8b5cf6",
  api:       "#ef4444",
  service:   "#3b82f6",
  database:  "#10b981",
  component: "#f59e0b",
  route:     "#06b6d4",
  function:  "#ec4899",
  other:     "#94a3b8",
};

const nodeWidth  = 520;

export interface CustomNodeData {
  type: string;
  label: string;
  routes?: string[];
  functions?: { name: string; code: string }[];
  code?: string;
  sequence?: number;
  highlighted?: boolean;
  selected?: boolean;
}

export default function CustomNode({ data, selected: isSelectedReactFlow }: NodeProps<CustomNodeData>) {
  const { type, label, sequence, highlighted, selected: isSelectedCustom } = data;
  const isSelected = isSelectedReactFlow || isSelectedCustom;
  const color = nodeColors[type] || nodeColors.other;
  
  const TypeIcon = (() => {
    if (type === "api") return Target;
    if (type === "route") return Target;
    if (type === "database") return Database;
    if (type === "folder") return FolderTree;
    if (type === "function") return Braces;
    if (type === "component") return Boxes;
    if (type === "service") return Wrench;
    if (type === "other") return FileCode2;
    return Zap;
  })();

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <div
          className={`relative p-5 rounded-[2.5rem] border-2 transition-all duration-700 group cursor-pointer glass-frosted ${
            isSelected
              ? `ring-2 ring-primary/30 scale-[1.07] -translate-y-6 border-primary/40 bg-accent/25 z-[100]`
              : `border-white/5 hover:scale-[1.05] hover:-translate-y-3 hover:border-white/20 bg-card/40`
          } ${
            highlighted === false ? "opacity-30 grayscale-[0.4] scale-[0.98]" : "opacity-100 shadow-2xl shadow-cyan-500/20"
          } text-card-foreground`}
          style={{ minWidth: `${nodeWidth}px` }}
        >
      {/* Sub-layer: High-End Prism Glass */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/[0.08] via-transparent to-black/[0.05] pointer-events-none" />

      {/* Atmospheric Type Aura - Breathing Animation on Focus */}
      <div
        className={`absolute -inset-[4px] rounded-[2.5rem] blur-[30px] opacity-10 dark:opacity-20 pointer-events-none transition-all duration-1000 ${isSelected ? 'opacity-50 blur-[50px] dark:opacity-70 scale-110' : 'group-hover:opacity-30'}`}
        style={{ backgroundColor: color, animation: isSelected ? 'breathe 4s infinite ease-in-out' : 'none' }}
      />

      {/* Sequence badge */}
      {sequence && (
        <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-black text-[20px] border-4 border-card shadow-xl z-50 transition-transform group-hover:scale-110">
          {sequence}
        </div>
      )}

      {/* Entry Point Label */}
      {sequence === 1 && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] z-50 flex items-center gap-2 animate-bounce border-2 border-white/20">
          <Zap size={10} fill="currentColor" className="animate-pulse" />
          Entry Point
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 8,
          height: 8,
          background: "var(--node-handle)",
          borderColor: "var(--node-handle-border)",
          opacity: 0,
          transition: "opacity 0.2s",
        }}
        className="group-hover:!opacity-100"
      />

      <div className="flex flex-col  p-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-5 overflow-hidden">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0`}
              style={{
                background: `linear-gradient(135deg, ${color}33, ${color}11)`, // 33 ≈ 20%, 11 ≈ 7%
                color: color,
                border: `1px solid ${color}44`,
              }}
            >
              <TypeIcon size={32} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h3 className="text-[25px] font-extrabold tracking-tight truncate leading-tight text-foreground drop-shadow-sm">
                {label}
              </h3>
              <p className="text-[14px] font-bold text-muted-foreground mt-1 truncate uppercase tracking-widest">
                {type} LAYER INSTANCE
              </p>
            </div>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 8,
          height: 8,
          background: "var(--node-handle)",
          borderColor: "var(--node-handle-border)",
          opacity: 0,
          transition: "opacity 0.2s",
        }}
        className="group-hover:!opacity-100"
      />
    </div>
    </TooltipTrigger>
    <TooltipContent side="top" className="flex flex-col gap-2 p-4 z-[10000] border-border/50 bg-card/95 backdrop-blur-3xl shadow-2xl max-w-sm">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10" style={{ backgroundColor: `${color}22`, color: color }}>
            <TypeIcon size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-black uppercase tracking-widest text-foreground">{label}</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">{type} Instance</span>
          </div>
       </div>
       <p className="text-[10px] text-muted-foreground opacity-80 italic leading-relaxed">
          {sequence === 1 
            ? "This is the primary architectural entry point. All system flows originate from here."
            : `Deep-layered ${type} logic that handles downstream orchestration.`
          }
       </p>
       <div className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MousePointer2 size={10} className="text-blue-400" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-blue-400">Click to focus node</span>
          </div>
       </div>
    </TooltipContent>
    </Tooltip>
  );
}
