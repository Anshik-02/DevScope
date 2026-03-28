"use client";

import {
  ArrowLeft,
  Search,
  Sun,
  Moon,
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
}

export default function GraphHeader({
  searchQuery,
  setSearchQuery,
  nodeColors,
  onBack,
  theme,
  setTheme,
  mounted,
}: Props) {
  return (
    <header className="h-16 border-b border-border bg-card/70 backdrop-blur-2xl flex items-center justify-between px-6 z-[60] shrink-0 relative transition-all">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
      
  
      <div className="flex items-center gap-6">
        
        <div className="flex items-center gap-3 mr-4">
          <Tooltip >
            <TooltipTrigger asChild>
              <button
                onClick={onBack}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground border border-border"
              >
                <ArrowLeft size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to repository selector</TooltipContent>
          </Tooltip>

          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={onBack}
          >
            <div className="w-8 h-8 rounded-lg text-white bg-black flex items-center justify-center font-black text-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
              D
            </div>

            <h1 className="text-lg font-black tracking-tighter italic uppercase  group-hover:opacity-80 transition-opacity">
              DevScope
            </h1>
          </div>
        </div>

  



        <div className="h-7 px-3 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 ml-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-purple-600">Active Core</span>
        </div>
      </div>


      <div className="flex items-center gap-8">
        

        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest bg-muted px-4 py-2 rounded-full border border-border">
          {Object.entries(nodeColors).map(([t, c]) => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              <span>{t}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-muted rounded-xl border border-border"
              >
                {mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle theme (Light/Dark)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}