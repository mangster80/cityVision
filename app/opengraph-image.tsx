import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "linear-gradient(135deg, #1d1634 0%, #4f46e5 46%, #e26ab8 100%)",
          color: "white",
          fontFamily: 'Inter, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.9 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,0.18)", fontSize: 28 }}>
              S
            </div>
            <div>Stadslyft</div>
          </div>
          <div style={{ display: "flex", padding: "10px 18px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Din stad, din vision
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 760 }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 0.96, letterSpacing: -5 }}>Små idéer.</div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 0.96, letterSpacing: -5 }}>Stor förändring.</div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: "rgba(255,255,255,0.82)", maxWidth: 640 }}>
            Upptäck platser, dela idéer och bidra till en bättre stad.
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, alignItems: "center", fontSize: 20, color: "rgba(255,255,255,0.8)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "white" }}>100+</div>
            <div>platser</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "white" }}>500+</div>
            <div>idéer</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "white" }}>1 stad</div>
            <div>i rörelse</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
