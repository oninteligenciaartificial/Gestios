export function formatMoney(amount: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-419", {
    style: "currency",
    currency: currency || "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
