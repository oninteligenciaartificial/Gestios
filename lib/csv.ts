/**
 * Converts an array of objects to a CSV string.
 * Values containing commas, quotes, or newlines are quoted and internal quotes are escaped.
 */
export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? "").replace(/"/g, '""');
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val}"`
          : val;
      }).join(",")
    ),
  ];
  return lines.join("\n");
}
