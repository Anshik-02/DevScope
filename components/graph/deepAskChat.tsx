"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RotateCcw,
  Database,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  repoName?: string;
}

export default function DeepAskChat({ isOpen, onClose, repoName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query: trimmed,
          repo: repoName ? repoName.toLowerCase() : null,
        }),
      });

      const data = await res.json();
      const answer = data.answer ?? data.msg ?? data.error ?? "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: answer,
          timestamp: new Date(),
        },
      ]);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Failed to get a response. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, repoName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/20"
        onClick={onClose}
      />

      {/* Panel — pure white, black text */}
      <div
        className="fixed right-0 top-0 h-full w-[460px] z-[70] flex flex-col"
        style={{
          background: "#ffffff",
          borderLeft: "1px solid #e5e5e5",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div
          style={{ borderBottom: "1px solid #e5e5e5" }}
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            {/* Icon badge */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#000", color: "#fff" }}
            >
              <Sparkles size={16} />
            </div>

            <div>
              <h2
                className="text-[13px] font-black uppercase tracking-widest leading-none"
                style={{ color: "#000" }}
              >
                Deep Ask
              </h2>
              {repoName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Database size={8} style={{ color: "#888" }} />
                  <span className="text-[9px] font-mono" style={{ color: "#888" }}>
                    {repoName.toLowerCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="p-2 rounded-lg transition-colors"
                style={{ color: "#999" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f4")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#999" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f4f4")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div className="flex-grow overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 && <EmptyState repoName={repoName} />}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT ── */}
        <div
          className="flex-shrink-0 px-5 py-4"
          style={{ borderTop: "1px solid #e5e5e5" }}
        >
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about the codebase…"
              rows={1}
              style={{
                resize: "none",
                background: "#f7f7f7",
                border: "1px solid #e0e0e0",
                color: "#000",
                borderRadius: "12px",
                outline: "none",
                fontSize: "13px",
                lineHeight: "1.6",
                padding: "12px 16px",
                minHeight: "48px",
                maxHeight: "140px",
                overflowY: "auto",
              }}
              className="flex-grow placeholder:text-[#aaa] transition-all"
              onFocus={(e) => (e.currentTarget.style.borderColor = "#000")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 140) + "px";
              }}
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "#000", color: "#fff" }}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>

          <p className="text-[9px] text-center mt-2" style={{ color: "#bbb" }}>
            Enter to send · Shift+Enter for new line · Esc to close
          </p>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */

const SUGGESTIONS = [
  "How does authentication work?",
  "Where is the main entry point?",
  "Explain the API routes structure.",
  "What database schema is used?",
];

function EmptyState({ repoName }: { repoName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 text-center">
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "#f4f4f4", border: "1px solid #e5e5e5" }}
      >
        <Bot size={26} style={{ color: "#000" }} />
      </div>

      <div className="space-y-1">
        <p
          className="text-[13px] font-black uppercase tracking-wider"
          style={{ color: "#000" }}
        >
          Ask about your repo
        </p>
        {repoName && (
          <p className="text-[11px] font-mono" style={{ color: "#888" }}>
            {repoName.toLowerCase()}
          </p>
        )}
        <p className="text-[11px] max-w-[260px] mx-auto" style={{ color: "#999" }}>
          I'll search through the embedded codebase and give you grounded answers.
        </p>
      </div>

      <div className="w-full space-y-2">
        <p
          className="text-[9px] uppercase tracking-[0.2em] font-black"
          style={{ color: "#bbb" }}
        >
          Try asking
        </p>
        {SUGGESTIONS.map((s) => (
          <div
            key={s}
            className="px-4 py-2.5 rounded-xl text-[11px] text-center"
            style={{
              background: "#f7f7f7",
              border: "1px solid #e5e5e5",
              color: "#666",
            }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "#000", color: "#fff" }}
          >
            <User size={13} />
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "#f0f0f0", border: "1px solid #e5e5e5" }}
          >
            <Bot size={13} style={{ color: "#000" }} />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className="px-4 py-3 rounded-2xl text-[12.5px] leading-relaxed"
          style={
            isUser
              ? {
                  background: "#000",
                  color: "#fff",
                  borderRadius: "18px 18px 4px 18px",
                }
              : {
                  background: "#f4f4f4",
                  color: "#111",
                  border: "1px solid #e5e5e5",
                  borderRadius: "18px 18px 18px 4px",
                }
          }
        >
          <FormattedContent content={message.content} isUser={isUser} />
        </div>
        <span className="text-[9px] px-1" style={{ color: "#bbb" }}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

function FormattedContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2">
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{renderInline(line.slice(2), isUser)}</span>
            </div>
          );
        }
        if (line === "") return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line, isUser)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string, isUser: boolean): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded-md text-[11px] font-mono"
          style={
            isUser
              ? { background: "rgba(255,255,255,0.15)", color: "#fff" }
              : { background: "#e8e8e8", color: "#000" }
          }
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "#f0f0f0", border: "1px solid #e5e5e5" }}
      >
        <Bot size={13} style={{ color: "#000" }} />
      </div>
      <div
        className="px-5 py-4 rounded-2xl flex items-center gap-1.5"
        style={{
          background: "#f4f4f4",
          border: "1px solid #e5e5e5",
          borderRadius: "18px 18px 18px 4px",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0ms]" style={{ background: "#999" }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms]" style={{ background: "#999" }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms]" style={{ background: "#999" }} />
      </div>
    </div>
  );
}