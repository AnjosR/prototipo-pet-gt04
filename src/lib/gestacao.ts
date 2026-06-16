export function calcIG(dum: string): { weeks: number; days: number; totalDays: number } | null {
  if (!dum) return null;
  const start = new Date(dum + "T00:00:00");
  if (isNaN(start.getTime())) return null;
  const diffMs = Date.now() - start.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (totalDays < 0) return null;
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7, totalDays };
}

export function calcDPP(dum: string): string | null {
  if (!dum) return null;
  const d = new Date(dum + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  // Regra de Naegele: DUM + 280 dias
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

export function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
}

export function formatIG(dum: string) {
  const ig = calcIG(dum);
  if (!ig) return "—";
  return `${ig.weeks}s ${ig.days}d`;
}
