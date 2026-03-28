"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, GitBranch } from "lucide-react";
import axios from "axios";

const EXAMPLES = [
  "Anshik-02/DevScope",
  "unavailable-code/Stream-Player",
  "Anshik-02/nebula_notes",
];

const Inputt = () => {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

const submitHandler = async () => {
  if (!link.trim()) return;
  setLoading(true);
  setError(null);

  try {
    const res = await axios.post("/api/analyse", { link });

    // Check for an error returned in the JSON body
    if (res.data?.error) {
      setError(res.data.error);
      setLoading(false);
      return;
    }

    if (res.data?.nodes) {
      localStorage.setItem("graphData", JSON.stringify(res.data));

      // Clean up github url to just owner/repo
      let repoStr = link.trim();
      if (repoStr.includes("github.com/")) {
        repoStr = repoStr.split("github.com/")[1];
      }
      // Remove trailing slashes
      repoStr = repoStr.replace(/\/$/, "");
      localStorage.setItem("repoName", repoStr);

      setLoading(false);
      router.push("/graph");
    } else {
      setError("No graph data was returned. Is this a valid GitHub repository?");
      setLoading(false);
    }
  } catch (e: any) {
    const msg = e?.response?.data?.error || "Something went wrong. Please try again.";
    setError(msg);
    setLoading(false);
  }
};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submitHandler();
  };

  return (
    <section className="relative pb-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        {/* Label */}
        <p className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Try it now — paste a GitHub repo URL
        </p>

        {/* Input Group */}
        <div
          className={`relative flex items-center rounded-2xl border-2 transition-all duration-300 shadow-lg dark:shadow-primary/5 ${
            focused
              ? "border-foreground/30 ring-4 ring-foreground/10 bg-background shadow-2xl dark:shadow-primary/10 scale-[1.01]"
              : "border-border/60 bg-background/80 hover:border-border hover:shadow-xl dark:hover:shadow-primary/10"
          } backdrop-blur-xl`}
        >
          <GitBranch
            size={18}
            className="absolute left-5 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent py-5 pl-12 pr-40 dark:shadow-xl dark:shadow-white/20 text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none rounded-xl"
            id="repo-input"
          />
          <button
            id="analyse-button"
            onClick={submitHandler}
            disabled={loading || !link.trim()}
            className="absolute right-2 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Analysing
              </>
            ) : (
              <>
                Analyse
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>

        {/* Loading Message Pop */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            loading ? "mt-6 max-h-16 opacity-100 scale-100" : "max-h-0 opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-medium text-primary shadow-sm relative">
            <Loader2 size={14} className="animate-spin" />
            <span>Analyzing repository architecture. This may take a bit, please wait...</span>
            <div className="absolute inset-0 rounded-full animate-pulse bg-primary/5 -z-10" />
          </div>
        </div>

        {/* Error Message */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            error ? "mt-4 max-h-16 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive shadow-sm">
            <span>⚠ {error}</span>
          </div>
        </div>

        {/* Example suggestions */}
        <div className={`flex flex-wrap items-center justify-center gap-2 transition-all duration-500 ${loading ? "mt-2 opacity-30 pointer-events-none" : "mt-4"}`}>
          <span className="text-xs text-muted-foreground">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setLink(`https://github.com/${ex}`)}
              className="rounded-full border border-border bg-accent/10 px-3 py-1 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Inputt;
