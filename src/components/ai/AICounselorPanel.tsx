"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AICounselorPanel.module.css";

export interface CollegeContext {
  id: string;
  name: string;
  shortName?: string;
  instituteType?: string;
}

interface Props {
  rank: string;
  category: string;
  exam: string;
  domicileState: string;
  gender: string;
  contextCollege: CollegeContext | null;
  onClose: () => void;
  isMobile?: boolean;
  resultsContext?: any;
}

const GENERIC_SUGGESTIONS = [
  "Show my top options with a full table",
  "I want CS/ECE — what's the best I can get?",
  "I'm interested in core engineering, what should I pick?",
  "How does home state quota change my options?",
];

const COLLEGE_SUGGESTIONS = [
  "Why is this the best choice for me?",
  "What are safer alternatives to this branch?",
  "What career paths does this branch open?",
  "Is a dual degree worth it here?",
];

// ── Inline markdown helpers ────────────────────────────────────────────────────

function InlineMd({ text }: { text: string }) {
  // First split by bold **text**
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {boldParts.map((bSeg, i) => {
        if (bSeg.startsWith("**") && bSeg.endsWith("**")) {
          return (
            <strong key={i} style={{ fontWeight: 600, color: "#1e293b" }}>
              {bSeg.slice(2, -2)}
            </strong>
          );
        }
        // Then split remaining segments by italic *text*
        const italicParts = bSeg.split(/(\*[^*\s].*?[^*\s]\*|\*[^*\s]\*)/g);
        return (
          <span key={i}>
            {italicParts.map((iSeg, j) => {
              if (iSeg.startsWith("*") && iSeg.endsWith("*") && !iSeg.startsWith("**")) {
                return <em key={j} style={{ fontStyle: "italic" }}>{iSeg.slice(1, -1)}</em>;
              }
              return <span key={j}>{iSeg}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}

function parseTableRow(line: string) {
  return line.split("|").filter(Boolean).map((s) => s.trim());
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const headers = parseTableRow(lines[0]);
  const rows = lines.slice(2).map(parseTableRow);
  return (
    <div className={styles.mdTableWrap}>
      <table className={styles.mdTable}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}><InlineMd text={h} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}><InlineMd text={cell} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AIMessageBody({ text }: { text: string }) {
  const elements: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      elements.push(<div key={i} className={styles.mdSpacer} />);
      i++;
      continue;
    }

    const isTableStart =
      line.trim().startsWith("|") &&
      lines[i + 1]?.trim().startsWith("|") &&
      lines[i + 1].includes("---");

    if (isTableStart) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i++]);
      }
      elements.push(<MarkdownTable key={`table-${i}`} lines={tableLines} />);
      continue;
    }

    const headingMatch = line.match(/^\s*#{1,3}\s+(.*)/);
    if (headingMatch) {
      elements.push(
        <p key={i} className={styles.mdHeading}>
          <InlineMd text={headingMatch[1]} />
        </p>
      );
      i++;
      continue;
    }

    const bulletMatch = line.match(/^\s*[-•*]\s+(.*)/);
    if (bulletMatch) {
      elements.push(
        <div key={i} className={styles.mdBullet}>
          <div className={styles.mdBulletDot} />
          <span className={styles.mdBulletText}><InlineMd text={bulletMatch[1]} /></span>
        </div>
      );
      i++;
      continue;
    }

    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className={styles.mdNumbered}>
          <span className={styles.mdNumberLabel}>{numberedMatch[1]}.</span>
          <span className={styles.mdBulletText}><InlineMd text={numberedMatch[2]} /></span>
        </div>
      );
      i++;
      continue;
    }

    elements.push(
      <p key={i} className={styles.mdParagraph}><InlineMd text={line} /></p>
    );
    i++;
  }

  return <div className={styles.mdBody}>{elements}</div>;
}

// ── Typing indicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className={styles.typingRow}>
      <div className={styles.aiAvatar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <div className={styles.typingBubble}>
        <span className={styles.typingDot} />
        <span className={styles.typingDot} />
        <span className={styles.typingDot} />
      </div>
    </div>
  );
}

// ── Welcome state ──────────────────────────────────────────────────────────────

interface WelcomeStateProps {
  rank: string;
  category: string;
  examLabel: string;
  domicileState: string;
  contextCollege: CollegeContext | null;
  suggestions: string[];
  isLoading: boolean;
  onSuggestion: (text: string) => void;
}

function WelcomeState({
  rank, category, examLabel, domicileState,
  contextCollege, suggestions, isLoading, onSuggestion,
}: WelcomeStateProps) {
  return (
    <div className={styles.welcomeStack}>
      {contextCollege ? (
        <div className={styles.contextCard}>
          <p className={styles.sectionLabel}>Current Context</p>
          <p className={styles.contextCollegeName}>{contextCollege.name}</p>
          <div className={styles.contextRow}>
            <p className={styles.contextBranchLabel}>Selected Branch</p>
            <span className={styles.highBadge}>HIGH</span>
          </div>
          <div className={styles.contextMeta}>
            <p>Your rank: <strong style={{ color: "#334155" }}>{parseInt(rank).toLocaleString()}</strong> ({examLabel})</p>
            <p>{domicileState}</p>
          </div>
        </div>
      ) : (
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.profileIconWrap}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className={styles.profileHeaderLabel}>Your Profile</p>
          </div>
          <div className={styles.profileGrid}>
            {[
              { label: "Rank", value: rank && rank !== "0" ? parseInt(rank).toLocaleString() : "Not Provided" },
              { label: "Category", value: category ? category.split(" ")[0] : "General" },
              { label: "Exam", value: examLabel },
              { label: "State", value: domicileState && domicileState !== "Unknown" ? (domicileState.length > 12 ? domicileState.slice(0, 11) + "…" : domicileState) : "Not Set" },
            ].map(({ label, value }) => (
              <div key={label} className={styles.profileCell}>
                <div className={styles.profileCellLabel}>{label}</div>
                <div className={styles.profileCellValue}>{value}</div>
              </div>
            ))}
          </div>
          <div className={styles.infoTip}>
            <span className={styles.infoTipIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className={styles.infoTipText}>
              Expand a college card to get context-aware suggestions about that specific college.
            </p>
          </div>
        </div>
      )}

      <div>
        <p className={styles.suggestionsLabel}>
          {contextCollege ? "Suggested Questions" : "Try asking"}
        </p>
        <div className={styles.suggestionsList}>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              disabled={isLoading}
              className={styles.suggestionBtn}
            >
              <span className={styles.suggestionBtnText}>{s}</span>
              <span className={styles.suggestionArrow}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AICounselorPanel({
  rank, category, exam, domicileState, gender,
  contextCollege,
  onClose,
  isMobile = false,
  resultsContext,
}: Props) {
  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctxRef = useRef({ rank, category, exam, domicileState, gender, contextCollege, resultsContext });
  
  const contextCollegeStr = JSON.stringify(contextCollege);
  const resultsContextStr = JSON.stringify(resultsContext);

  useEffect(() => {
    ctxRef.current = { rank, category, exam, domicileState, gender, contextCollege, resultsContext };
  }, [rank, category, exam, domicileState, gender, contextCollegeStr, resultsContextStr]);

  const transport = useMemo(
    () =>
      /* eslint-disable-next-line react-hooks/refs */
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

  const { messages, sendMessage, status, error, setMessages, regenerate } = useChat({ transport });
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const suggestions = contextCollege ? COLLEGE_SUGGESTIONS : GENERIC_SUGGESTIONS;
  const examLabel = exam === "JEE Advanced" ? "Advanced" : "Mains";

  async function send(text: string) {
    if (!text.trim() || isLoading) return;
    setInput("");
    await sendMessage({ text });
  }

  function handleNewChat() {
    if (isLoading) return;
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  function handleRegenerate() {
    if (isLoading || messages.length === 0) return;
    regenerate();
  }

  return (
    <div className={isMobile ? styles.panelMobile : styles.panelDesktop}>
      {isMobile && (
        <div className={styles.mobileHandleWrap}>
          <div className={styles.mobileHandle} />
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.792 0-5.484-.228-8.065-.659-1.717-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </div>

        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>AI Counsellor</h2>
          {contextCollege ? (
            <div className={styles.contextBadge}>
              <p className={styles.contextBadgeText}>
                {contextCollege.shortName ?? contextCollege.name}
              </p>
            </div>
          ) : (
            <div className={styles.onlineRow}>
              <span className={styles.onlineDot} />
              <p className={styles.onlineLabel}>Online &amp; Ready</p>
            </div>
          )}
        </div>

        <button onClick={onClose} aria-label="Close AI panel" className={styles.closeBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messagesArea} ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <WelcomeState
            rank={rank}
            category={category}
            examLabel={examLabel}
            domicileState={domicileState}
            contextCollege={contextCollege}
            suggestions={suggestions}
            isLoading={isLoading}
            onSuggestion={send}
          />
        ) : (
          <>
            {messages.map((m) => {
              const text = Array.isArray(m.parts) && m.parts.length > 0
                ? m.parts
                    .filter((p) => p.type === "text")
                    .map((p) => (p as { type: "text"; text: string }).text)
                    .join("")
                : (m as unknown as { content?: string }).content ?? "";
              if (!text) return null;

              if (m.role === "user") {
                return (
                  <div key={m.id} className={styles.userRow}>
                    <div className={styles.userBubble}>{text}</div>
                  </div>
                );
              }

              return (
                <div key={m.id} className={styles.aiRow}>
                  <div className={styles.aiAvatar}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div className={styles.aiBubble}>
                    <AIMessageBody text={text} />
                  </div>
                </div>
              );
            })}

            {isLoading && <TypingIndicator />}

            {error && (
              <div className={styles.errorBox}>Something went wrong. Please try again.</div>
            )}
          </>
        )}

        {messages.length >= 2 && messages.length <= 4 && !isLoading && (
          <div className={styles.quickChipsRow}>
            {suggestions.slice(0, 2).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={isLoading}
                className={styles.quickChip}
              >
                {s}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Input area */}
      <div className={styles.inputArea}>
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className={styles.inputForm}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading}
            aria-label="Ask AI counsellor"
            className={styles.textInput}
          />
          <div className={styles.inputToolbar}>
            <div className={styles.inputActions}>
              <button
                type="button"
                onClick={handleNewChat}
                disabled={isLoading || messages.length === 0}
                className={styles.iconBtn}
                title="Start new chat"
                aria-label="Start new chat"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isLoading || messages.length === 0}
                className={styles.iconBtn}
                title="Regenerate response"
                aria-label="Regenerate response"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className={styles.sendBtn}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
