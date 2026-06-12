import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill, Sequence } from "remotion";

const ORANGE = "#FF6B00";
const BG = "#0a0a0a";

const features = [
  "POS completo",
  "Inventario en tiempo real",
  "CRM de clientes",
  "Reportes avanzados",
  "WhatsApp integrado",
  "Facturación SIAT",
];

export const Scene6CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Confetti particles (deterministic, no random)
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: (i * 137.5) % 1280,
    color: i % 3 === 0 ? ORANGE : i % 3 === 1 ? "#FF9A3C" : "#fff",
    size: 6 + (i % 4) * 3,
    speed: 1.5 + (i % 5) * 0.4,
    startFrame: i * 8,
  }));

  const logoOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const logoScale = spring({ frame, fps, config: { damping: 20, stiffness: 200 } });

  const titleOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [30, 55], [30, 0], { extrapolateRight: "clamp" });

  const subOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" });

  const ctaScale = spring({ frame: frame - 120, fps, config: { damping: 12, stiffness: 200 } });
  const ctaOpacity = interpolate(frame, [120, 140], [0, 1], { extrapolateRight: "clamp" });

  // Pulsing glow
  const glowSize = interpolate(frame, [0, 30, 60, 90], [580, 620, 580, 620], { extrapolateRight: "extend" });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* Confetti */}
      {particles.map((p, i) => {
        const elapsed = Math.max(0, frame - p.startFrame);
        const y = interpolate(elapsed, [0, 200], [-20, 750], { extrapolateRight: "clamp" });
        const rotate = elapsed * 3;
        const particleOpacity = interpolate(elapsed, [0, 10, 160, 200], [0, 1, 1, 0], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute",
            left: p.x,
            top: y,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 2,
            opacity: particleOpacity,
            transform: `rotate(${rotate}deg)`,
          }} />
        );
      })}

      {/* Pulsing background glow */}
      <div style={{
        position: "absolute",
        width: glowSize,
        height: glowSize,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${ORANGE}18 0%, transparent 65%)`,
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
        gap: 14,
        marginBottom: 24,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${ORANGE}, #FF9A3C)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: 28, fontFamily: "system-ui", fontWeight: 800, color: "#fff" }}>G</span>
        </div>
        <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", fontFamily: "system-ui", letterSpacing: -1.5 }}>
          GestiOS
        </span>
      </div>

      {/* Title */}
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 58, fontWeight: 900, color: "#fff", fontFamily: "system-ui", margin: 0, lineHeight: 1.05 }}>
          Tu negocio,<br />
          <span style={{ color: ORANGE }}>en control total</span>
        </h1>
      </div>

      {/* Subtitle */}
      <p style={{ opacity: subOpacity, color: "#888", fontFamily: "system-ui", fontSize: 20, marginBottom: 40, textAlign: "center" }}>
        Más de 50 negocios bolivianos ya gestionan con GestiOS
      </p>

      {/* Feature pills */}
      <div style={{ opacity: subOpacity, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 48, maxWidth: 700 }}>
        {features.map((f, i) => {
          const pillOpacity = interpolate(frame, [80 + i * 10, 100 + i * 10], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={f} style={{
              opacity: pillOpacity,
              padding: "8px 18px",
              borderRadius: 999,
              border: `1px solid ${ORANGE}44`,
              background: `${ORANGE}11`,
              color: ORANGE,
              fontFamily: "system-ui",
              fontSize: 14,
              fontWeight: 600,
            }}>
              ✓ {f}
            </div>
          );
        })}
      </div>

      {/* CTA button */}
      <div style={{
        opacity: ctaOpacity,
        transform: `scale(${ctaScale})`,
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${ORANGE}, #FF9A3C)`,
          borderRadius: 16,
          padding: "20px 56px",
          textAlign: "center",
          boxShadow: `0 0 60px ${ORANGE}44`,
        }}>
          <p style={{ color: "#fff", fontFamily: "system-ui", fontWeight: 800, fontSize: 22, margin: 0 }}>
            Pruébalo gratis 7 días
          </p>
          <p style={{ color: "#ffffff99", fontFamily: "system-ui", fontSize: 14, margin: "6px 0 0" }}>
            Sin tarjeta de crédito · gestios.bo
          </p>
        </div>
      </div>

      {/* Timer indicator */}
      <Sequence from={400} layout="none">
        <div style={{
          position: "absolute",
          bottom: 40,
          opacity: interpolate(frame - 400, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          display: "flex",
          gap: 6,
        }}>
          {[0, 1, 2, 3, 4, 5].map((dot) => (
            <div key={dot} style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dot === 5 ? ORANGE : "#333",
            }} />
          ))}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
