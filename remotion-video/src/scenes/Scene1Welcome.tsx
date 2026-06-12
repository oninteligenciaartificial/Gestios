import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";

const ORANGE = "#FF6B00";
const BG = "#0a0a0a";

export const Scene1Welcome = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 20, stiffness: 200 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const titleOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [20, 45], [30, 0], { extrapolateRight: "clamp" });

  const taglineOpacity = interpolate(frame, [40, 65], [0, 1], { extrapolateRight: "clamp" });

  const pill1Opacity = interpolate(frame, [60, 75], [0, 1], { extrapolateRight: "clamp" });
  const pill2Opacity = interpolate(frame, [70, 85], [0, 1], { extrapolateRight: "clamp" });
  const pill3Opacity = interpolate(frame, [80, 95], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${ORANGE}22 0%, transparent 70%)`,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }} />

      {/* Logo */}
      <div style={{
        opacity: logoOpacity,
        transform: `scale(${logoScale})`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 32,
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${ORANGE}, #FF9A3C)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: 32, fontFamily: "system-ui", fontWeight: 700, color: "#fff" }}>G</span>
        </div>
        <span style={{ fontSize: 48, fontWeight: 800, color: "#fff", fontFamily: "system-ui", letterSpacing: -2 }}>
          GestiOS
        </span>
      </div>

      {/* Title */}
      <div style={{
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        textAlign: "center",
        marginBottom: 20,
      }}>
        <h1 style={{
          fontSize: 52,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "system-ui",
          margin: 0,
          lineHeight: 1.1,
        }}>
          El sistema que se adapta<br />
          <span style={{ color: ORANGE }}>a tu negocio</span>
        </h1>
      </div>

      {/* Tagline */}
      <p style={{
        opacity: taglineOpacity,
        fontSize: 22,
        color: "#888",
        fontFamily: "system-ui",
        marginBottom: 48,
      }}>
        Gestión inteligente para negocios bolivianos
      </p>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "POS", opacity: pill1Opacity },
          { label: "Inventario", opacity: pill2Opacity },
          { label: "Reportes", opacity: pill3Opacity },
        ].map(({ label, opacity }) => (
          <div key={label} style={{
            opacity,
            padding: "10px 24px",
            borderRadius: 999,
            border: `1px solid ${ORANGE}44`,
            background: `${ORANGE}11`,
            color: ORANGE,
            fontSize: 16,
            fontFamily: "system-ui",
            fontWeight: 600,
          }}>
            {label}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
