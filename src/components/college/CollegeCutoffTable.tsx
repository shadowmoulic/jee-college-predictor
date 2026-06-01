"use client";

import { useState, useMemo } from "react";

export interface CutoffRecord {
  program: string;
  degree: string;
  quota: string;
  seatType: string;
  gender: string;
  openingRank: number;
  closingRank: number;
}

interface Props {
  cutoffs: CutoffRecord[];
  typeColor: string;
}

const SEAT_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "var(--high-bg)", text: "var(--high-text)" },
  "OBC-NCL": { bg: "#fef3e2", text: "#b25e02" },
  SC: { bg: "#fee5e6", text: "#b71f1f" },
  ST: { bg: "#fce7f3", text: "#9d174d" },
  EWS: { bg: "var(--brand-soft)", text: "var(--brand)" },
};

export default function CollegeCutoffTable({ cutoffs, typeColor }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [quota, setQuota] = useState("All");
  const [gender, setGender] = useState("All");

  const categories = useMemo(() => ["All", ...Array.from(new Set(cutoffs.map(c => c.seatType))).sort()], [cutoffs]);
  const quotas = useMemo(() => ["All", ...Array.from(new Set(cutoffs.map(c => c.quota))).sort()], [cutoffs]);
  const genders = useMemo(() => ["All", ...Array.from(new Set(cutoffs.map(c => c.gender))).sort()], [cutoffs]);

  const filtered = useMemo(() => {
    return cutoffs.filter(c => {
      if (search && !c.program.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "All" && c.seatType !== category) return false;
      if (quota !== "All" && c.quota !== quota) return false;
      if (gender !== "All" && c.gender !== gender) return false;
      return true;
    });
  }, [cutoffs, search, category, quota, gender]);

  return (
    <div>
      <div style={{
        display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem",
        background: "#fff", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ flex: "1 1 250px" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase" }}>Search Branch</label>
          <input
            type="text"
            placeholder="e.g. Computer Science"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem" }}
          />
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase" }}>Category / Caste</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem", backgroundColor: "#fff" }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 120px" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase" }}>Quota</label>
          <select
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem", backgroundColor: "#fff" }}
          >
            {quotas.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 120px" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase" }}>Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem", backgroundColor: "#fff" }}
          >
            {genders.map(g => <option key={g} value={g}>{g === "Female-only" ? "Female" : g}</option>)}
          </select>
        </div>
      </div>

      <div style={{
        background: "#fff", border: "1px solid var(--border)", borderRadius: 20,
        overflow: "hidden", boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ background: "var(--table-head)", borderBottom: "2px solid var(--border)" }}>
                {["Program", "Degree", "Quota", "Seat Type", "Gender", "Opening", "Closing"].map((h) => (
                  <th key={h} style={{
                    padding: "14px 16px", textAlign: "left", fontSize: "0.78rem",
                    fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No cutoff data matches your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const sc = SEAT_COLORS[r.seatType] ?? { bg: "var(--surface-3)", text: "var(--text-secondary)" };
                  return (
                    <tr key={i} style={{
                      borderTop: "1px solid var(--border-light)",
                      background: i % 2 === 0 ? "#fff" : "var(--surface-2)",
                      transition: "background 0.15s",
                    }}>
                      <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                        {r.program}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {r.degree}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          background: "var(--brand-soft)", color: "var(--brand)",
                          padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700,
                        }}>
                          {r.quota}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          background: sc.bg, color: sc.text,
                          padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700,
                        }}>
                          {r.seatType}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {r.gender === "Female-only" ? "♀ Female" : "All"}
                      </td>
                      <td style={{ padding: "13px 16px", fontWeight: 700, color: "var(--success)", fontSize: "0.92rem" }}>
                        {r.openingRank.toLocaleString()}
                      </td>
                      <td style={{ padding: "13px 16px", fontWeight: 800, color: typeColor, fontSize: "0.95rem" }}>
                        {r.closingRank.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
