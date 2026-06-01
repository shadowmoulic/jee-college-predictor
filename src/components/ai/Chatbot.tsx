"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";

const transport = new TextStreamChatTransport({ api: "/api/chat" });

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center bg-(--brand) text-white shadow-[0_6px_20px_rgba(26,86,219,0.4)] z-50 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(26,86,219,0.5)] active:translate-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50"
      >
        {open ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="animate-slide-up fixed bottom-24 right-6 w-90 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-[0_20px_60px_rgba(11,21,48,0.18)] border border-(--border) z-50 flex flex-col overflow-hidden"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-(--brand) text-white shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Nexus AI Counsellor</p>
              <p className="text-white/70 text-xs">Ask me about JEE colleges &amp; cutoffs</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-(--text-muted) text-sm mt-8 space-y-2">
                <div className="text-3xl">🎓</div>
                <p className="font-semibold text-(--text-secondary)">Hi! I&apos;m your JEE counsellor.</p>
                <p>Ask me about colleges, branches, cutoffs, or counselling strategy.</p>
              </div>
            )}

            {messages.map((m) => {
              const textContent = m.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { type: "text"; text: string }).text)
                .join("");
              if (!textContent) return null;
              return (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-(--brand) text-white rounded-br-md"
                        : "bg-(--surface-3) text-(--text) rounded-bl-md"
                    }`}
                  >
                    {textContent}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-(--surface-3) px-3 py-2 rounded-2xl rounded-bl-md flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-(--text-muted) rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-(--text-muted) rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-(--text-muted) rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-(--danger) text-center">
                Something went wrong. Please try again.
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-(--border) shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about colleges, cutoffs…"
              disabled={isLoading}
              aria-label="Chat message"
              className="flex-1 h-10 px-3 bg-(--surface-3) rounded-xl text-sm text-(--text) outline-none border-2 border-transparent focus:border-(--brand) focus:bg-white transition-all duration-150 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-(--brand) text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg className="w-4 h-4 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
