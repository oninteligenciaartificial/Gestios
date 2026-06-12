import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";

const ORANGE = "#FF6B00";
const BG = "#0a0a0a";
const CARD = "#111317";

const products = [
  { name: "Camiseta Básica Negra", stock: 48, price: "Bs. 85", category: "Ropa" },
  { name: "Jeans Slim Azul", stock: 23, price: "Bs. 220", category: "Ropa" },
  { name: "Polo Deportivo", stock: 67, price: "Bs. 120", category: "Ropa" },
  { name: "Vestido Floral", stock: 12, price: "Bs. 195", category: "Ropa" },
  { name: "Chaqueta Cuero", stock: 8, price: "Bs. 450", category: "Ropa" },
];

export const Scene3Inventory = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const statsScale = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const statsOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  const tableOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, padding: 48 }}>
      {/* Header */}
      <div style={{ opacity: headerOpacity, marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: ORANGE, fontFamily: "system-ui", fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 4 }}>
            MÓDULO 2
          </p>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: "#fff", fontFamily: "system-ui", margin: 0 }}>
            Inventario Inteligente
          </h2>
          <p style={{ color: "#666", fontFamily: "system-ui", marginTop: 8, fontSize: 16 }}>
            Control total de tu stock en tiempo real
          </p>
        </div>
        <div style={{
          padding: "10px 20px",
          borderRadius: 10,
          background: `${ORANGE}18`,
          border: `1px solid ${ORANGE}44`,
          color: ORANGE,
          fontFamily: "system-ui",
          fontWeight: 600,
          fontSize: 14,
        }}>
          + Agregar producto
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        opacity: statsOpacity,
        transform: `scale(${statsScale})`,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 16,
        marginBottom: 28,
      }}>
        {[
          { label: "Total productos", value: "158", color: ORANGE },
          { label: "Stock bajo", value: "3", color: "#EF4444" },
          { label: "Categorías", value: "12", color: "#22C55E" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: CARD,
            borderRadius: 14,
            border: "1px solid #1e1e1e",
            padding: "20px 24px",
          }}>
            <p style={{ color: "#666", fontFamily: "system-ui", fontSize: 13, margin: 0, marginBottom: 6 }}>{label}</p>
            <p style={{ color, fontFamily: "system-ui", fontSize: 32, fontWeight: 800, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Products table */}
      <div style={{ opacity: tableOpacity, background: CARD, borderRadius: 16, border: "1px solid #1e1e1e", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          padding: "14px 20px",
          borderBottom: "1px solid #1e1e1e",
        }}>
          {["Producto", "Categoría", "Stock", "Precio"].map((h) => (
            <span key={h} style={{ color: "#555", fontFamily: "system-ui", fontSize: 13, fontWeight: 600 }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {products.map((p, i) => {
          const rowOpacity = interpolate(frame, [50 + i * 18, 70 + i * 18], [0, 1], { extrapolateRight: "clamp" });
          const rowX = interpolate(frame, [50 + i * 18, 70 + i * 18], [-20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={p.name} style={{
              opacity: rowOpacity,
              transform: `translateX(${rowX}px)`,
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              padding: "14px 20px",
              borderBottom: i < products.length - 1 ? "1px solid #161616" : "none",
              alignItems: "center",
            }}>
              <span style={{ color: "#e5e5e5", fontFamily: "system-ui", fontSize: 15 }}>{p.name}</span>
              <span style={{ color: "#555", fontFamily: "system-ui", fontSize: 14 }}>{p.category}</span>
              <span style={{
                color: p.stock < 10 ? "#EF4444" : "#22C55E",
                fontFamily: "system-ui",
                fontSize: 14,
                fontWeight: 600,
              }}>{p.stock} unid.</span>
              <span style={{ color: "#e5e5e5", fontFamily: "system-ui", fontSize: 14 }}>{p.price}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
