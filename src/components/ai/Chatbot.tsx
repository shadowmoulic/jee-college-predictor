"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Chatbot.module.css";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [contextData, setContextData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem("nexus_ai_context");
      if (stored) {
        try {
          setContextData(JSON.parse(stored));
        } catch (err) {
          console.error("Failed to parse stored chatbot context", err);
        }
      }
    }
  }, [open]);

  const ctx = useMemo(() => {
    if (!contextData?.filters) return null;
    return {
      rank: contextData.filters.rank || "0",
      category: contextData.filters.category || "General",
      exam: contextData.filters.exam || "JEE Main",
      domicileState: contextData.filters.domicileState || "Unknown",
      gender: contextData.filters.gender || "Male",
      resultsContext: contextData.resultsContext || null,
    };
  }, [contextData]);

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages }) => ({
          api: "/api/chat",
          headers: { "Content-Type": "application/json" } as HeadersInit,
          body: { messages, context: ctx } as object,
        }),
      }),
    [ctx]
  );

  const { messages, sendMessage, status, error } = useChat({ transport });
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className={styles.trigger}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className={styles.window}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div className={styles.headerInfo}>
              <p className={styles.headerName}>AI Counsellor</p>
              <div className={styles.headerStatus}>
                <span className={styles.statusDot} />
                <p className={styles.statusText}>JEE &amp; JoSAA expert</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className={styles.closeBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <p className={styles.emptyTitle}>Ask me anything about JEE</p>
                <p className={styles.emptySubtitle}>
                  Colleges, branches, cutoffs, counselling rounds — I have it all.
                </p>
              </div>
            )}

            {messages.map((m) => {
              const textContent = m.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { type: "text"; text: string }).text)
                .join("");
              if (!textContent) return null;

              if (m.role === "user") {
                return (
                  <div key={m.id} className={styles.userRow}>
                    <div className={styles.userBubble}>{textContent}</div>
                  </div>
                );
              }

              return (
                <div key={m.id} className={styles.aiRow}>
                  <div className={styles.aiAvatarSmall}>
                    <span>AI</span>
                  </div>
                  <div className={styles.aiBubble}>{textContent}</div>
                </div>
              );
            })}

            {isLoading && (
              <div className={styles.loadingRow}>
                <div className={styles.aiAvatarSmall}>
                  <span>AI</span>
                </div>
                <div className={styles.loadingBubble}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            )}

            {error && (
              <div className={styles.errorBox}>Something went wrong. Please try again.</div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about colleges, cutoffs…"
              disabled={isLoading}
              aria-label="Chat message"
              className={styles.textInput}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className={styles.sendBtn}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
