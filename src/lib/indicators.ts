import type { Gestante, IndicatorKey, Indicators, Role } from "./types";
import { calcIG } from "./gestacao";

export type IndicatorType = "boolean" | "count";

export interface IndicatorDef {
  key: IndicatorKey;
  label: string;
  short: string;
  type: IndicatorType;
  max?: number;
  owner: Role; // quem é responsável pelo preenchimento
}

export const INDICATORS: IndicatorDef[] = [
  {
    key: "A",
    short: "1ª consulta ≤12s",
    label: "1ª consulta presencial/remota até a 12ª semana de gestação.",
    type: "boolean",
    owner: "medico",
  },
  {
    key: "B",
    short: "7 consultas pré-natal",
    label: "Pelo menos 7 consultas presenciais/remotas durante a gestação.",
    type: "count",
    max: 7,
    owner: "medico",
  },
  {
    key: "C",
    short: "7 aferições PA",
    label: "Pelo menos 7 aferições de pressão arterial durante a gestação.",
    type: "count",
    max: 7,
    owner: "medico",
  },
  {
    key: "D",
    short: "7 medidas peso/altura",
    label: "Pelo menos 7 registros simultâneos de peso e altura.",
    type: "count",
    max: 7,
    owner: "medico",
  },
  {
    key: "E",
    short: "3 visitas ACS",
    label: "Pelo menos 3 visitas domiciliares do ACS/TACS após a 1ª consulta.",
    type: "count",
    max: 3,
    owner: "acs",
  },
  {
    key: "F",
    short: "Vacina dTpa ≥20s",
    label: "Vacina dTpa registrada a partir da 20ª semana de gestação.",
    type: "boolean",
    owner: "medico",
  },
  {
    key: "G",
    short: "Testes 1º tri",
    label: "Testes/exames para sífilis, HIV e hepatite B no 1º trimestre.",
    type: "boolean",
    owner: "medico",
  },
  {
    key: "H",
    short: "Testes 3º tri",
    label: "Testes/exames para sífilis e HIV no 3º trimestre.",
    type: "boolean",
    owner: "medico",
  },
  {
    key: "I",
    short: "Consulta puerpério",
    label: "Pelo menos 1 consulta no puerpério (médico/enfermeiro).",
    type: "boolean",
    owner: "medico",
  },
  {
    key: "J",
    short: "Visita ACS puerpério",
    label: "Pelo menos 1 visita domiciliar do ACS/TACS no puerpério.",
    type: "boolean",
    owner: "acs",
  },
  {
    key: "K",
    short: "Saúde bucal",
    label: "Pelo menos 1 atividade em saúde bucal (dentista/TSB) na gestação.",
    type: "boolean",
    owner: "dentista",
  },
];

export function emptyIndicators(): Indicators {
  return { A: null, B: 0, C: 0, D: 0, E: 0, F: null, G: null, H: null, I: null, J: null, K: null };
}

export type Status = "ok" | "warn" | "late" | "na";

/**
 * Status por indicador combinando valor + IG (semanas).
 * verde = atingido / em dia
 * amarelo = próximo do vencimento
 * vermelho = vencido / atrasado
 */
export function indicatorStatus(g: Gestante, key: IndicatorKey): Status {
  const v = g.indicadores[key];
  const ig = calcIG(g.dum);
  const w = ig?.weeks ?? 0;
  const postParto = !!g.dataParto;

  switch (key) {
    case "A":
      if (v === true) return "ok";
      if (w < 12) return "warn";
      return "late";
    case "B": {
      const n = Number(v) || 0;
      if (n >= 7) return "ok";
      const expected = Math.min(7, Math.max(0, Math.floor(w / 5))); // ~1 a cada 5 sem
      if (n >= expected) return "warn";
      return "late";
    }
    case "C":
    case "D": {
      const n = Number(v) || 0;
      if (n >= 7) return "ok";
      const expected = Math.min(7, Math.max(0, Math.floor(w / 5)));
      if (n >= expected) return "warn";
      return "late";
    }
    case "E": {
      const n = Number(v) || 0;
      if (n >= 3) return "ok";
      if (w < 12) return "warn";
      return "late";
    }
    case "F":
      if (v === true) return "ok";
      if (w < 20) return "na";
      if (w < 28) return "warn";
      return "late";
    case "G":
      if (v === true) return "ok";
      if (w <= 13) return "warn";
      return "late";
    case "H":
      if (v === true) return "ok";
      if (w < 28) return "na";
      if (w < 36) return "warn";
      return "late";
    case "I":
    case "J":
      if (v === true) return "ok";
      if (!postParto) return "na";
      return "late";
    case "K":
      if (v === true) return "ok";
      if (w < 20) return "warn";
      return "late";
  }
}

export function statusColor(s: Status) {
  switch (s) {
    case "ok":
      return "bg-status-ok text-status-ok-foreground";
    case "warn":
      return "bg-status-warn text-status-warn-foreground";
    case "late":
      return "bg-status-late text-status-late-foreground";
    case "na":
      return "bg-muted text-muted-foreground";
  }
}

export function canEditIndicator(role: Role, key: IndicatorKey): boolean {
  if (role === "medico") return true;
  if (role === "dentista") return key === "K";
  if (role === "acs") return key === "E" || key === "J";
  return false;
}

/**
 * Indicadores visíveis para o perfil: cada usuário enxerga apenas o que
 * remete ao seu contexto. Médico/Enfermeiro vê todos; ACS vê E e J;
 * Dentista vê apenas K.
 */
export function visibleIndicatorsFor(role: Role): IndicatorDef[] {
  return INDICATORS.filter((i) => role === "medico" || i.owner === role);
}
