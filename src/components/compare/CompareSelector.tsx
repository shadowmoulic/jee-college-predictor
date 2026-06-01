"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  colleges: { id: string; name: string }[];
}

export default function CompareSelector({ colleges }: Props) {
  const [col1, setCol1] = useState("");
  const [col2, setCol2] = useState("");
  const router = useRouter();

  const handleCompare = () => {
    if (col1 && col2 && col1 !== col2) {
      router.push(`/compare/${col1}-vs-${col2}`);
    } else {
      alert("Please select two different colleges to compare.");
    }
  };

  return (
    <div style={{
      background: "#fff",
      padding: "2rem",
      borderRadius: "16px",
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--border)",
      maxWidth: "800px",
      margin: "0 auto",
    }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text)" }}>
        Select Two Colleges to Compare
      </h2>
      
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 300px" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase" }}>College 1</label>
          <select
            value={col1}
            onChange={(e) => setCol1(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid var(--border)", fontSize: "1rem" }}
          >
            <option value="">-- Select College 1 --</option>
            {colleges.map(c => (
              <option key={`c1-${c.id}`} value={c.id} disabled={c.id === col2}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ fontWeight: 800, color: "var(--text-muted)", fontSize: "1.2rem", padding: "12px 0" }}>VS</div>

        <div style={{ flex: "1 1 300px" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase" }}>College 2</label>
          <select
            value={col2}
            onChange={(e) => setCol2(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid var(--border)", fontSize: "1rem" }}
          >
            <option value="">-- Select College 2 --</option>
            {colleges.map(c => (
              <option key={`c2-${c.id}`} value={c.id} disabled={c.id === col1}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={!col1 || !col2 || col1 === col2}
        style={{
          marginTop: "2rem", width: "100%", padding: "14px",
          background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
          color: "#fff", border: "none", borderRadius: "10px",
          fontSize: "1.1rem", fontWeight: 800, cursor: (!col1 || !col2 || col1 === col2) ? "not-allowed" : "pointer",
          opacity: (!col1 || !col2 || col1 === col2) ? 0.6 : 1,
          boxShadow: "0 4px 14px rgba(26,86,219,0.3)"
        }}
      >
        Compare Now →
      </button>
    </div>
  );
}
