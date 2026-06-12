import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";

const ORANGE = "#FF6B00";
const BG = "#0a0a0a";
const CARD = "#111317";

const BAR_DATA = [
  { label: "Lun", value: 0.45 },
  { label: "Mar", value: 0.72 },
  { label: "Mié", value: 0.58 },
  { label: "Jue", value: 0.88 },
  { label: "Vie", value: 0.95 },
  { label: "Sáb", value: 1.0 },
  { label: "Dom", value: 0.62 },
];

export const Scene5Reports = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const statsScale = spring({ frame: frame - 15, fps, config: { damping: 200 } });
  const statsOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  const chartOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, padding: 48 }}>
      {/* Header */}
      <div style={{ opacity: headerOpacity, marginBottom: 28 }}>
        <p style={{ color: ORANGE, fontFamily: "system-ui", fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 4 }}>MÓDULO 4</p>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: "#fff", fontFamily: "system-ui", margin: 0 }}>
          Reportes y Analíticas
        </h2>
        <p style={{ color: "#666", fontFamily: "system-ui", marginTop: 8, fontSize: 16 }}>
          Decisiones basadas en datos reales
        </p>
      </div>

      {/* KPI cards */}
      <div style={{
        opacity: statsOpacity,
        transform: `scale(${statsScale})`,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 16,
        marginBottom: 28,
      }}>
        {[
          { label: "Ventas hoy", value: "Bs. 3,240", change: "+12%", positive: true },
          { label: "Tickets", value: "28", change: "+5%", positive: true },
          { label: "Ticket prom.", value: "Bs. 115", change: "+7%", positive: true },
          { label: "Productos", value: "158", change: "3 bajos", positive: false },
        ].map(({ label, value, change, positive }) => (
          <div key={label} style={{
            background: CARD,
            borderRadius: 14,
            border: "1px solid #1e1e1e",
            padding: "18px 20px",
          }}>
            <p style={{ color: "#555", fontFamily: "system-ui", fontSize: 12, margin: 0, marginBottom: 4 }}>{label}</p>
            <p style={{ color: "#fff", fontFamily: "system-ui", fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 4 }}>{value}</p>
            <p style={{ color: positive ? "#22C55E" : "#EF4444", fontFamily: "system-ui", fontSize: 12, fontWeight: 600, margin: 0 }}>
              {change}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{
        opacity: chartOpacity,
        background: CARD,
        borderRadius: 16,
        border: "1px solid #1e1e1e",
        padding: "24px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ color: "#fff", fontFamily: "system-ui", fontSize: 18, fontWeight: 700, margin: 0 }}>
            Ventas esta semana
          </h3>
          <span style={{ color: "#555", fontFamily: "system-ui", fontSize: 13 }}>vs semana anterior</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 160 }}>
          {BAR_DATA.map(({ label, value }, i) => {
            const barHeight = interpolate(
              frame,
              [50 + i * 12, 80 + i * 12],
              [0, value * 140],
              { extrapolateRight: "clamp" }
            );
            const isToday = i === 5;
            return (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                {isToday && (
                  <span style={{ color: ORANGE, fontFamily: "system-ui", fontSize: 11, fontWeight: 700 }}>
                    HOY
                  </span>
                )}
                <div style={{
                  width: "100%",
                  height: barHeight,
                  borderRadius: "6px 6px 0 0",
                  background: isToday
                    ? `linear-gradient(180deg, ${ORANGE}, #FF9A3C)`
                    : "#2a2a2a",
                }} />
                <span style={{ color: "#555", fontFamily: "system-ui", fontSize: 12 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
