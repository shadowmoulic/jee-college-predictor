import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | JEE College Predicter",
  description: "The page you are looking for does not exist. Navigate back to JEE College Predicter home or try our AI Counselor.",
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: "85vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--surface-2)",
      padding: "2rem",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative Animated Glow Blobs */}
      <div style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "var(--brand-glow)",
        filter: "blur(80px)",
        top: "10%",
        left: "15%",
        zIndex: 1,
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: "rgba(220, 38, 38, 0.05)",
        filter: "blur(60px)",
        bottom: "15%",
        right: "15%",
        zIndex: 1,
        pointerEvents: "none"
      }} />

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .btn-hover {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          filter: brightness(1.05);
        }
        .btn-outline-hover {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .btn-outline-hover:hover {
          transform: translateY(-2px);
          background: var(--brand-soft);
          border-color: var(--brand) !important;
          color: var(--brand) !important;
        }
      `}</style>

      <div className="animate-slide-up" style={{
        background: "var(--surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        padding: "clamp(2rem, 5vw, 3.5rem)",
        maxWidth: "600px",
        width: "100%",
        textAlign: "center",
        boxShadow: "var(--shadow-lg)",
        position: "relative",
        zIndex: 2,
        backdropFilter: "blur(8px)",
      }}>
        {/* Large 404 Illustration / Graphic */}
        <div style={{ position: "relative", marginBottom: "2rem" }}>
          <div className="animate-float" style={{
            fontSize: "clamp(6rem, 15vw, 8rem)",
            fontWeight: 900,
            lineHeight: 1,
            background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.05em",
            userSelect: "none"
          }}>
            404
          </div>
          
          {/* Badge / Cap Graphic */}
          <div style={{
            position: "absolute",
            top: "10%",
            right: "20%",
            background: "var(--danger)",
            color: "#fff",
            padding: "4px 12px",
            borderRadius: "9999px",
            fontSize: "var(--text-xs)",
            fontWeight: 800,
            textTransform: "uppercase",
            boxShadow: "var(--shadow-sm)",
            transform: "rotate(12deg)",
            letterSpacing: "0.05em"
          }}>
            Rank Out of Bounds!
          </div>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: "var(--text-h2)",
          fontWeight: 800,
          color: "var(--ink)",
          marginBottom: "1rem",
          letterSpacing: "-0.02em"
        }}>
          Page Not Found
        </h1>

        {/* Message */}
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "var(--text-base)",
          lineHeight: 1.6,
          marginBottom: "2.5rem",
          maxWidth: "480px",
          margin: "0 auto 2.5rem"
        }}>
          Looks like this route has a rank outside the cutoff limits. Don&apos;t worry, you can easily navigate back to safety and find your ideal college.
        </p>

        {/* Actions */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <Link 
            id="not-found-back-home-btn"
            href="/" 
            className="btn-hover"
            style={{
              background: "var(--brand)",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
              boxShadow: "var(--shadow-brand)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              cursor: "pointer"
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Back Home
          </Link>

          <Link 
            id="not-found-ai-btn"
            href="/ai" 
            className="btn-outline-hover"
            style={{
              background: "transparent",
              color: "var(--text-secondary)",
              padding: "12px 28px",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
              border: "1px solid var(--border-strong)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer"
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Consult AI Counsellor
          </Link>
        </div>
      </div>
    </div>
  );
}
