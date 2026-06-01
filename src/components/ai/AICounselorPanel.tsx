"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

export interface CollegeContext {
  id: string;
  name: string;
  shortName?: string;
  instituteType?: string;
  avgPackage?: string;
  placementRate?: string;
}

interface Props {
  rank: string;
  category: string;
  exam: string;
  domicileState: string;
  gender: string;
  contextCollege: CollegeContext | null;
  onClose: () => void;
  /** True when rendered as a mobile bottom-sheet overlay */
  isMobile?: boolean;
}

const GENERIC_SUGGESTIONS = [
  "What is the best branch under my rank?",
  "How does home state quota work?",
  "Which IIT has the best CS placements?",
  "How do JoSAA counselling rounds work?",
];

function getCollegeSuggestions(college: CollegeContext): string[] {
  const name = college.shortName || college.name.replace("Indian Institute of Technology ", "IIT ");
  return [
    `Why is ${name} recommended for me?`,
    `Compare ${name} with other top IITs`,
    `What are the placement stats at ${name}?`,
    `Which branch at ${name} suits my rank best?`,
  ];
}

/** Render a single line of AI text, converting **bold** to <strong> safely */
function InlineMd({ text }: { text: string }) {
  const segments = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {segments.map((seg, i) =>
        seg.startsWith("**") && seg.endsWith("**") ? (
          <strong key={i}>{seg.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{seg}</span>
        )
      )}
    </>
  );
}

/** Render AI message text with bullet lists, numbered lists, and inline bold */
function AIMessageBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Heading: ## or #
        if (/^#{1,3}\s/.test(line)) {
          const content = line.replace(/^#{1,3}\s/, "");
          return (
            <p key={i} className="font-bold text-[var(--text)] mt-2">
              <InlineMd text={content} />
            </p>
          );
        }

        // Bullet
        if (/^[-•*]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <div className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[var(--brand)] flex-shrink-0" />
              <span className="text-[var(--text)]">
                <InlineMd text={line.replace(/^[-•*]\s/, "")} />
              </span>
            </div>
          );
        }

        // Numbered list
        const numMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-[var(--brand)] font-bold text-xs mt-[3px] flex-shrink-0 w-4">
                {numMatch[1]}.
              </span>
              <span className="text-[var(--text)]">
                <InlineMd text={numMatch[2]} />
              </span>
            </div>
          );
        }

        return (
          <p key={i} className="text-[var(--text)]">
            <InlineMd text={line} />
          </p>
        );
      })}
    </div>
  );
}

export default function AICounselorPanel({
  rank,
  category,
  exam,
  domicileState,
  gender,
  contextCollege,
  onClose,
  isMobile = false,
}: Props) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep context accessible in the send-request closure without recreating transport
  const ctxRef = useRef({ rank, category, exam, domicileState, gender, contextCollege });
  useEffect(() => {
    ctxRef.current = { rank, category, exam, domicileState, gender, contextCollege };
  }, [rank, category, exam, domicileState, gender, contextCollege]);

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages }) => ({
          api: "/api/chat",
          headers: { "Content-Type": "application/json" } as HeadersInit,
          body: { messages, context: ctxRef.current } as object,
        }),
      }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({ transport });
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input when panel opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const suggestions = contextCollege
    ? getCollegeSuggestions(contextCollege)
    : GENERIC_SUGGESTIONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
  };

  const handleSuggestion = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage({ text: prompt });
  };

  const panelBase = isMobile
    ? "fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[28px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-slide-up overflow-hidden"
    : "h-full bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] flex flex-col overflow-hidden";

  const panelStyle = isMobile ? { height: "86vh" } : {};

  return (
    <div className={panelBase} style={panelStyle}>
      {/* Mobile drag handle */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] flex-shrink-0 bg-white">
        <div className="w-9 h-9 rounded-xl bg-[var(--brand)] flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[var(--text)] leading-tight">AI Counsellor</p>
          {contextCollege ? (
            <p className="text-xs text-[var(--brand)] font-semibold truncate">
              {contextCollege.shortName || contextCollege.name}
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">JEE &amp; JoSAA expert</p>
          )}
        </div>
        {contextCollege?.instituteType && (
          <span className="text-[10px] font-bold bg-[var(--brand-soft)] text-[var(--brand)] px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide">
            {contextCollege.instituteType}
          </span>
        )}
        <button
          onClick={onClose}
          aria-label="Close AI panel"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-3)] transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Messages / Welcome state ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          /* Welcome */
          <div className="space-y-4">
            {/* Profile snapshot */}
            <div className="bg-[var(--surface-3)] rounded-2xl p-4 border border-[var(--border-light)]">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">
                Your Profile
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Rank", value: parseInt(rank).toLocaleString() },
                  { label: "Category", value: category.split(" ")[0] },
                  { label: "Exam", value: exam === "JEE Advanced" ? "Advanced" : "Mains" },
                  { label: "State", value: domicileState.length > 12 ? domicileState.slice(0, 11) + "…" : domicileState },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl p-2.5 border border-[var(--border-light)]">
                    <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wide mb-0.5">
                      {label}
                    </div>
                    <div className="font-bold text-sm text-[var(--text)] truncate">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Context college card */}
            {contextCollege ? (
              <div className="bg-[var(--brand-soft)] border border-[var(--brand-light)] rounded-2xl p-3.5">
                <p className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-wider mb-1">
                  Currently Viewing
                </p>
                <p className="font-bold text-sm text-[var(--text)]">{contextCollege.name}</p>
                {(contextCollege.avgPackage || contextCollege.placementRate) && (
                  <div className="flex gap-2 mt-2">
                    {contextCollege.avgPackage && (
                      <span className="text-[10px] font-bold bg-white text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                        Avg {contextCollege.avgPackage}
                      </span>
                    )}
                    {contextCollege.placementRate && (
                      <span className="text-[10px] font-bold bg-white text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                        {contextCollege.placementRate} placed
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-amber-800">
                  Expand a college card to get context-aware suggestions about that specific college.
                </p>
              </div>
            )}

            {/* Suggested prompts */}
            <div>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">
                {contextCollege ? "Suggested Questions" : "Try asking"}
              </p>
              <div className="flex flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    disabled={isLoading}
                    className="text-left text-sm px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--brand-soft)] hover:border-[var(--brand)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-all duration-150 font-medium disabled:opacity-50 group"
                  >
                    <span className="text-[var(--brand)] mr-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation */
          <>
            {messages.map((m) => {
              const textContent = m.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { type: "text"; text: string }).text)
                .join("");
              if (!textContent) return null;

              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-[var(--brand)] text-white text-sm leading-relaxed">
                      {textContent}
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="flex justify-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[var(--brand-soft)] border border-[var(--brand-light)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] font-black text-[var(--brand)] tracking-tight">AI</span>
                  </div>
                  <div className="flex-1 min-w-0 bg-white border border-[var(--border)] rounded-2xl rounded-bl-md px-3.5 py-3 shadow-sm">
                    <AIMessageBody text={textContent} />
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[var(--brand-soft)] border border-[var(--brand-light)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-black text-[var(--brand)] tracking-tight">AI</span>
                </div>
                <div className="bg-white border border-[var(--border)] rounded-2xl rounded-bl-md px-3.5 py-3 flex gap-1 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600 text-center">
                Something went wrong. Please try again.
              </div>
            )}
          </>
        )}

        {/* Quick suggestion chips after first exchange */}
        {messages.length >= 2 && messages.length <= 4 && !isLoading && (
          <div className="flex gap-2 flex-wrap pt-1">
            {suggestions.slice(0, 2).map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                disabled={isLoading}
                className="text-xs px-2.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all whitespace-nowrap disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-3 border-t border-[var(--border)] flex-shrink-0 bg-white"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about colleges, cutoffs…"
          disabled={isLoading}
          aria-label="Ask AI counsellor"
          className="flex-1 h-10 px-3 bg-[var(--surface-3)] rounded-xl text-sm text-[var(--text)] outline-none border-2 border-transparent focus:border-[var(--brand)] focus:bg-white transition-all duration-150 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-[var(--brand)] text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        >
          <svg className="w-4 h-4 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </form>
    </div>
  );
}
