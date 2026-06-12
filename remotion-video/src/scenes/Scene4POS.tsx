import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill, Sequence } from "remotion";

const ORANGE = "#FF6B00";
const BG = "#0a0a0a";
const CARD = "#111317";

const cartItems = [
  { name: "Camiseta Básica", qty: 2, price: 85 },
  { name: "Jeans Slim", qty: 1, price: 220 },
  { name: "Polo Deportivo", qty: 3, price: 120 },
];

const total = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

export const Scene4POS = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const leftPanelX = interpolate(frame, [10, 35], [-40, 0], { extrapolateRight: "clamp" });
  const leftOpacity = interpolate(frame, [10, 35], [0, 1], { extrapolateRight: "clamp" });

  const rightPanelX = interpolate(frame, [20, 45], [40, 0], { extrapolateRight: "clamp" });
  const rightOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });

  // Payment success animation at frame 320
  const paymentScale = spring({ frame: frame - 320, fps, config: { damping: 12, stiffness: 200 } });
  const paymentOpacity = interpolate(frame, [320, 335], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, padding: 48 }}>
      {/* Header */}
      <div style={{ opacity: headerOpacity, marginBottom: 28 }}>
        <p style={{ color: ORANGE, fontFamily: "system-ui", fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 4 }}>MÓDULO 3</p>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: "#fff", fontFamily: "system-ui", margin: 0 }}>
          Punto de Venta
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, height: 520 }}>
        {/* Product grid */}
        <div style={{
          opacity: leftOpacity,
          transform: `translateX(${leftPanelX}px)`,
          background: CARD,
          borderRadius: 16,
          border: "1px solid #1e1e1e",
          padding: 20,
        }}>
          <input
            style={{
              width: "100%",
              background: "#0a0a0a",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              padding: "10px 14px",
              color: "#fff",
              fontFamily: "system-ui",
              fontSize: 14,
              marginBottom: 16,
              boxSizing: "border-box",
            }}
            placeholder="🔍  Buscar producto..."
            readOnly
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {["Camiseta Básica", "Jeans Slim", "Polo Deportivo", "Vestido Floral", "Chaqueta", "Gorra"].map((name, i) => {
              const cardOpacity = interpolate(frame, [25 + i * 10, 45 + i * 10], [0, 1], { extrapolateRight: "clamp" });
              return (
                <div key={name} style={{
                  opacity: cardOpacity,
                  background: "#0d0d0d",
                  borderRadius: 10,
                  border: "1px solid #222",
                  padding: 14,
                  textAlign: "center",
                }}>
                  <div style={{ width: 40, height: 40, background: "#1a1a1a", borderRadius: 8, margin: "0 auto 8px" }} />
                  <p style={{ color: "#ddd", fontFamily: "system-ui", fontSize: 12, margin: 0, marginBottom: 4 }}>{name}</p>
                  <p style={{ color: ORANGE, fontFamily: "system-ui", fontSize: 13, fontWeight: 700, margin: 0 }}>
                    Bs. {[85, 220, 120, 195, 450, 60][i]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div style={{
          opacity: rightOpacity,
          transform: `translateX(${rightPanelX}px)`,
          background: CARD,
          borderRadius: 16,
          border: "1px solid #1e1e1e",
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}>
          <h3 style={{ color: "#fff", fontFamily: "system-ui", fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
            Carrito ({cartItems.length})
          </h3>

          {cartItems.map((item, i) => {
            const itemOpacity = interpolate(frame, [60 + i * 25, 80 + i * 25], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={item.name} style={{
                opacity: itemOpacity,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #1a1a1a",
              }}>
                <div>
                  <p style={{ color: "#ddd", fontFamily: "system-ui", fontSize: 14, margin: 0 }}>{item.name}</p>
                  <p style={{ color: "#555", fontFamily: "system-ui", fontSize: 12, margin: 0 }}>x{item.qty}</p>
                </div>
                <span style={{ color: "#fff", fontFamily: "system-ui", fontSize: 14, fontWeight: 600 }}>
                  Bs. {item.qty * item.price}
                </span>
              </div>
            );
          })}

          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid #222" }}>
              <span style={{ color: "#888", fontFamily: "system-ui", fontSize: 16 }}>Total</span>
              <span style={{ color: ORANGE, fontFamily: "system-ui", fontSize: 22, fontWeight: 800 }}>Bs. {total}</span>
            </div>

            {/* Payment button */}
            <div style={{
              background: `linear-gradient(135deg, ${ORANGE}, #FF9A3C)`,
              borderRadius: 10,
              padding: 14,
              textAlign: "center",
            }}>
              <span style={{ color: "#fff", fontFamily: "system-ui", fontWeight: 700, fontSize: 16 }}>
                Cobrar Bs. {total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment success overlay */}
      {frame >= 320 && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "#00000099",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: paymentOpacity,
        }}>
          <div style={{
            transform: `scale(${paymentScale})`,
            background: CARD,
            borderRadius: 24,
            border: `1px solid #22C55E44`,
            padding: "40px 60px",
            textAlign: "center",
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#22C55E22",
              border: "2px solid #22C55E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 32,
            }}>✓</div>
            <h3 style={{ color: "#22C55E", fontFamily: "system-ui", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>
              ¡Venta completada!
            </h3>
            <p style={{ color: "#888", fontFamily: "system-ui", fontSize: 16, margin: 0 }}>Bs. {total} cobrado exitosamente</p>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
