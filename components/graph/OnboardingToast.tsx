"use client";

import { useEffect, useState } from "react";
import { X, MousePointer2, ZoomIn, History, GitBranch, Cpu } from "lucide-react";

const TIPS = [
  { icon: MousePointer2, text: "Click any node to expand its children & view details" },
  { icon: GitBranch,     text: "Hit Auto Trace for a cinematic walk-through of the architecture" },
  { icon: ZoomIn,        text: "Switch between Minimal (tree) and Complex (sequence) views" },
  { icon: Cpu,           text: "Ask AI about any node — get instant code explanations" },
  { icon: History,       text: "Your sessions are saved locally — open History to revisit them" },
];

const STORAGE_KEY = "devscope_onboarding_seen";

export default function OnboardingToast() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay so the graph has time to render first
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setExiting(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-24 left-1/2 z-[200] transition-all duration-400 ${
        exiting
          ? "opacity-0 translate-y-4 pointer-events-none"
          : "opacity-100 translate-y-0"
      }`}
      style={{ transform: `translateX(-50%) ${exiting ? "translateY(16px)" : "translateY(0)"}` }}
    >
      <div className="relative bg-card/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(168,85,247,0.15)] px-6 py-5 w-[340px] sm:w-[420px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-purple-400">DevScope</p>
            <p className="text-[10px] text-muted-foreground opacity-60 uppercase tracking-widest">Quick Start Guide</p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tips list */}
        <div className="space-y-3">
          {TIPS.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Icon size={13} className="text-purple-400" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <button
          onClick={dismiss}
          className="mt-5 w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-purple-400 transition-all"
        >
          Got it, let's explore →
        </button>

        {/* Animated glow dot */}
        <div className="absolute top-4 right-12 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,1)]" />
      </div>
    </div>
  );
}
