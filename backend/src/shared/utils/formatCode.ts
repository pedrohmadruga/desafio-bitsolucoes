export function formatCode(id: number): string {
  return `SOL-${String(id).padStart(6, "0")}`;
}
