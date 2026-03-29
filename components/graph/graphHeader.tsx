"use client";

import {
  ArrowLeft,
  Sun,
  Moon,
  History,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  nodeColors: Record<string, string>;

  onBack: () => void;

  theme: string | undefined;
  setTheme: (theme: string) => void;
  mounted: boolean;
  graphView: "minimal" | "complex";
  setGraphView: (v: "minimal" | "complex") => void;
  onOpenHistory: () => void;
}

export default function GraphHeader({
  searchQuery,
  setSearchQuery,
  nodeColors,
  onBack,
  theme,
  setTheme,
  mounted,
  graphView,
  setGraphView,
  onOpenHistory,
}: Props) {
  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card/70 backdrop-blur-2xl flex items-center justify-between px-3 sm:px-6 z-[60] shrink-0 relative transition-all">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

      {/* LEFT: Back + Logo */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground border border-border shrink-0"
            >
              <ArrowLeft size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Back to repository selector</TooltipContent>
        </Tooltip>

        <div
          className="flex items-center gap-2 group cursor-pointer"
          onClick={onBack}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-white bg-black flex items-center justify-center font-black text-base sm:text-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
            D
          </div>
          <h1 className="text-sm sm:text-lg font-black tracking-tighter italic uppercase group-hover:opacity-80 transition-opacity hidden sm:block">
            DevScope
          </h1>
        </div>

        {/* Active Core badge — desktop only */}
        <div className="h-6 sm:h-7 px-2 sm:px-3 bg-purple-500/10 border border-purple-500/20 rounded-full hidden md:flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-purple-600">Active Core</span>
        </div>
      </div>

      {/* RIGHT: Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Node color legend — large screens only */}
        <div className="hidden lg:flex items-center gap-4 text-[9px] font-black uppercase tracking-widest bg-muted px-4 py-2 rounded-full border border-border">
          {Object.entries(nodeColors).map(([t, c]) => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              <span>{t}</span>
            </div>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setGraphView("minimal")}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all ${
              graphView === "minimal"
                ? "bg-purple-600 text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Minimal graph
          </button>
          <button
            onClick={() => setGraphView("complex")}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all ${
              graphView === "complex"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Complex graph
          </button>
        </div>

        {/* History */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenHistory}
              className="p-2 hover:bg-muted rounded-xl border border-border"
            >
              <History size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Discovery History</TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-muted rounded-xl border border-border"
            >
              {mounted && (theme === "dark" ? <Sun size={15} /> : <Moon size={15} />)}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle theme</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}