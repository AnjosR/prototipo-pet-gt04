export type Role = "medico" | "acs" | "dentista";

export interface User {
  username: string;
  password: string;
  role: Role;
  displayName: string;
}

export type IndicatorKey =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K";

export interface Indicators {
  A: boolean | null;            // Sim/Não
  B: number;                    // 0-7
  C: number;                    // 0-7
  D: number;                    // 0-7
  E: number;                    // 0-3
  F: boolean | null;
  G: boolean | null;
  H: boolean | null;
  I: boolean | null;
  J: boolean | null;
  K: boolean | null;
}

export interface AuditEntry {
  user: string;
  role: Role;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  at: string; // ISO
}

export interface Gestante {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;       // yyyy-mm-dd
  endereco: string;
  telefone: string;
  cartaoSus: string;
  dum: string;                  // yyyy-mm-dd
  microarea: string;            // ACS responsável
  primeiraConsulta: string;
  dataParto: string;
  indicadores: Indicators;
  audit: AuditEntry[];
  createdAt: string;
  createdBy: string;
}
