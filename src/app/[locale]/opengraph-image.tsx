import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TradeM — ASIC-майнери в Україні";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0b0b08",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid texture via background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(236,194,70,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(236,194,70,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gold top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #ecc246, transparent)",
          }}
        />

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {/* Brand */}
          <div
            style={{
              display: "flex",
              fontSize: 120,
              fontWeight: 800,
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#e5e2db" }}>Trade</span>
            <span style={{ color: "#ecc246" }}>M</span>
          </div>

          {/* Separator */}
          <div
            style={{
              width: 120,
              height: 2,
              background: "#ecc246",
              marginTop: 24,
              marginBottom: 28,
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 30,
              color: "#d1c5af",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            ASIC-майнери в Україні
          </div>

          {/* Brands row */}
          <div
            style={{
              display: "flex",
              gap: 32,
              marginTop: 32,
              fontSize: 16,
              color: "#d1c5af66",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            <span>Antminer</span>
            <span style={{ color: "#ecc24666" }}>◆</span>
            <span>Whatsminer</span>
            <span style={{ color: "#ecc24666" }}>◆</span>
            <span>Jasminer</span>
            <span style={{ color: "#ecc24666" }}>◆</span>
            <span>Avalon</span>
          </div>
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 18,
            color: "#d1c5af55",
            letterSpacing: "0.2em",
          }}
        >
          tradem.com.ua
        </div>

        {/* Gold bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #ecc246, transparent)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
