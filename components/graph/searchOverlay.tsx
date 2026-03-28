"use client";

import { Search, Command, Sparkles, ArrowUpRight, X } from "lucide-react";
import { Node } from "reactflow";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredNodes: Node[];
  onSelectNode: (node: Node) => void;
}


export default function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  filteredNodes,
  onSelectNode,
}: Props) {
 if (!isOpen) return null;
return(
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-24 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-card rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col">
        

        <div className="p-6 border-b border-border flex items-center gap-4 bg-muted/50">
          <Search className="text-muted-foreground" size={20} />
          <input
            autoFocus
            placeholder="Search nodes, APIs, services..."
            className="flex-grow bg-transparent outline-none text-foreground font-bold placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 bg-card px-2 py-1 rounded-lg border border-border shadow-sm">
            <Command size={10} className="text-muted-foreground" />
            <span className="text-[10px] font-black text-muted-foreground">K</span>
          </div>
        </div>


        <div className="flex-grow max-h-[400px] overflow-y-auto p-4">
          {filteredNodes.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredNodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    onSelectNode(n);
                    onClose();
                    setSearchQuery("");
                  }}
                  className="flex items-center justify-between p-4 hover:bg-accent hover:text-accent-foreground rounded-2xl transition-all group text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-accent-foreground">
                      {n.data?.type}
                    </span>
                    <span className="text-sm font-black italic">
                      {n.data?.label}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-muted-foreground group-hover:text-accent-foreground"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center gap-3">
              <Sparkles className="text-muted" size={40} />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
                Type to search the blueprint
              </p>
            </div>
          )}
        </div>
      </div>


      <button
        onClick={onClose}
        className="absolute top-8 right-8 p-3 bg-card hover:bg-muted rounded-2xl text-muted-foreground transition-all shadow-xl font-bold"
      >
        <X size={20} />
      </button>
    </div>


        )}