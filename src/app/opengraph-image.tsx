import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "JEE College Predictor 2027 — IITs, NITs, IIITs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #072319 0%, #104332 50%, #176044 100%)",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid dots */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            J
          </div>
          <span
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.5px",
            }}
          >
            JEE College Predictor
          </span>
        </div>

        {/* Main heading */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            marginBottom: "24px",
            maxWidth: "900px",
          }}
        >
          JEE College
          <br />
          Predictor 2027
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "rgba(255,255,255,0.75)",
            fontWeight: 400,
            marginBottom: "48px",
            maxWidth: "720px",
            lineHeight: 1.5,
          }}
        >
          Free rank-based estimates for IITs, NITs, IIITs & GFTIs — based on official JoSAA 2025 cutoff data.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "16px" }}>
          {["IITs", "NITs", "IIITs", "GFTIs", "JoSAA 2025 Data"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 20px",
                borderRadius: "50px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.22)",
                color: "rgba(255,255,255,0.9)",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            right: "80px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 500,
          }}
        >
          JEE College Predictor
        </div>
      </div>
    ),
    { ...size }
  );
}
