import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill, Sequence } from "remotion";

const ORANGE = "#FF6B00";
const BG = "#0a0a0a";
const CARD = "#111317";

const businessTypes = ["General", "Ropa", "Farmacia", "Electrónica", "Ferretería", "Suplementos"];

export const Scene2Setup = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: "clamp" });

  const formScale = spring({ frame: frame - 15, fps, config: { damping: 200 } });
  const formOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  // Simulate typing in org name
  const orgNameLength = Math.floor(interpolate(frame, [40, 90], [0, 16], { extrapolateRight: "clamp" }));
  const orgName = "Mi Tienda Bolivia".slice(0, orgNameLength);

  // Business type selection animates in
  const gridOpacity = interpolate(frame, [80, 110], [0, 1], { extrapolateRight: "clamp" });
  const selectedIdx = frame > 150 ? 0 : -1; // "General" gets selected at frame 150

  return (
    <AbsoluteFill style={{ backgroundColor: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 }}>
      {/* Step indicator */}
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: s === 1 ? 32 : 8,
              height: 8,
              borderRadius: 4,
              background: s === 1 ? ORANGE : "#333",
            }} />
          ))}
        </div>
        <h2 style={{ fontSize: 38, fontWeight: 800, color: "#fff", fontFamily: "system-ui", margin: 0 }}>
          Configura tu <span style={{ color: ORANGE }}>negocio</span>
        </h2>
        <p style={{ color: "#666", fontFamily: "system-ui", marginTop: 8, fontSize: 18 }}>Paso 1 de 3 — Solo toma 2 minutos</p>
      </div>

      {/* Form card */}
      <div style={{
        opacity: formOpacity,
        transform: `scale(${formScale})`,
        background: CARD,
        borderRadius: 20,
        border: "1px solid #222",
        padding: 40,
        width: 600,
      }}>
        {/* Org name input */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ color: "#888", fontFamily: "system-ui", fontSize: 14, display: "block", marginBottom: 8 }}>
            Nombre de tu negocio
          </label>
          <div style={{
            background: "#0a0a0a",
            border: `1px solid ${ORANGE}88`,
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
          }}>
            <span style={{ color: "#fff", fontFamily: "system-ui", fontSize: 18 }}>{orgName}</span>
            <span style={{ color: ORANGE, opacity: frame % 30 < 20 ? 1 : 0, marginLeft: 2 }}>|</span>
          </div>
        </div>

        {/* Business type grid */}
        <label style={{ color: "#888", fontFamily: "system-ui", fontSize: 14, display: "block", marginBottom: 12 }}>
          Tipo de negocio
        </label>
        <div style={{ opacity: gridOpacity, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {businessTypes.map((type, i) => (
            <div key={type} style={{
              padding: "12px 8px",
              borderRadius: 10,
              border: `1px solid ${i === selectedIdx ? ORANGE : "#2a2a2a"}`,
              background: i === selectedIdx ? `${ORANGE}18` : "#0d0d0d",
              color: i === selectedIdx ? ORANGE : "#888",
              fontFamily: "system-ui",
              fontSize: 14,
              fontWeight: 600,
              textAlign: "center",
            }}>
              {type}
            </div>
          ))}
        </div>

        {/* CTA button */}
        <Sequence from={200} layout="none">
          <div style={{
            marginTop: 28,
            background: `linear-gradient(135deg, ${ORANGE}, #FF9A3C)`,
            borderRadius: 10,
            padding: "14px",
            textAlign: "center",
            opacity: interpolate(frame - 200, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            <span style={{ color: "#fff", fontFamily: "system-ui", fontWeight: 700, fontSize: 16 }}>
              Continuar →
            </span>
          </div>
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
