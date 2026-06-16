import type { AuditEntry, Gestante, IndicatorKey, Indicators } from "./types";
import { emptyIndicators } from "./indicators";

const KEY = "ubs.gestantes.v1";

type Listener = () => void;
const listeners = new Set<Listener>();



function read(): Gestante[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as Gestante[];
  } catch {
    return [];
  }
}

function write(list: Gestante[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((l) => l());
}

function seed(): Gestante[] {
  const today = new Date();
  const mk = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().slice(0, 10);
  };
  const list: Gestante[] = [
    {
      id: crypto.randomUUID(),
      nome: "Maria Aparecida Silva",
      cpf: "123.456.789-00",
      dataNascimento: "1995-04-12",
      endereco: "Rua das Flores, 120 — Parnaíba",
      telefone: "(86) 99999-1111",
      cartaoSus: "700 1234 5678 9012",
      dum: mk(70),
      microarea: "Microárea 03 — ACS Joana",
      primeiraConsulta: mk(40),
      dataParto: "",
      indicadores: { ...emptyIndicators(), A: true, B: 2, C: 2, D: 2, E: 1, G: true },
      audit: [],
      createdAt: new Date().toISOString(),
      createdBy: "seed",
    },
    {
      id: crypto.randomUUID(),
      nome: "Ana Beatriz Souza",
      cpf: "987.654.321-00",
      dataNascimento: "1998-08-30",
      endereco: "Av. Beira Rio, 45 — Parnaíba",
      telefone: "(86) 98888-2222",
      cartaoSus: "700 9999 0000 1111",
      dum: mk(180),
      microarea: "Microárea 01 — ACS Carlos",
      primeiraConsulta: mk(150),
      dataParto: "",
      indicadores: { ...emptyIndicators(), A: true, B: 5, C: 5, D: 4, E: 2, F: true, G: true },
      audit: [],
      createdAt: new Date().toISOString(),
      createdBy: "seed",
    },
    {
      id: crypto.randomUUID(),
      nome: "Juliana Martins Rocha",
      cpf: "456.789.123-00",
      dataNascimento: "1992-12-05",
      endereco: "Rua São João, 88 — Parnaíba",
      telefone: "(86) 97777-3333",
      cartaoSus: "700 2222 3333 4444",
      dum: mk(290),
      microarea: "Microárea 03 — ACS Joana",
      primeiraConsulta: mk(260),
      dataParto: mk(10),
      indicadores: { ...emptyIndicators(), A: true, B: 7, C: 7, D: 7, E: 3, F: true, G: true, H: true, K: true },
      audit: [],
      createdAt: new Date().toISOString(),
      createdBy: "seed",
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export const store = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  list(): Gestante[] {
    return read();
  },
  get(id: string): Gestante | undefined {
    return read().find((g) => g.id === id);
  },
  create(g: Omit<Gestante, "id" | "indicadores" | "audit" | "createdAt">): Gestante {
    const novo: Gestante = {
      ...g,
      id: crypto.randomUUID(),
      indicadores: emptyIndicators(),
      audit: [],
      createdAt: new Date().toISOString(),
    };
    const list = read();
    list.unshift(novo);
    write(list);
    return novo;
  },
  updatePatient(id: string, patch: Partial<Gestante>, by: { user: string; role: Gestante["audit"][number]["role"] }) {
    const list = read();
    const idx = list.findIndex((g) => g.id === id);
    if (idx < 0) return;
    const before = list[idx];
    const after = { ...before, ...patch };
    const audit: AuditEntry[] = [...before.audit];
    Object.keys(patch).forEach((k) => {
      const key = k as keyof Gestante;
      if (key === "audit" || key === "indicadores") return;
      if ((before as any)[key] !== (after as any)[key]) {
        audit.push({
          user: by.user, role: by.role, field: key,
          oldValue: (before as any)[key], newValue: (after as any)[key],
          at: new Date().toISOString(),
        });
      }
    });
    after.audit = audit;
    list[idx] = after;
    write(list);
  },
  setIndicator(id: string, key: IndicatorKey, value: Indicators[IndicatorKey], by: { user: string; role: AuditEntry["role"] }) {
    const list = read();
    const idx = list.findIndex((g) => g.id === id);
    if (idx < 0) return;
    const before = list[idx];
    const old = before.indicadores[key];
    if (old === value) return;
    const indicadores = { ...before.indicadores, [key]: value } as Indicators;
    const audit: AuditEntry[] = [
      ...before.audit,
      { user: by.user, role: by.role, field: `indicador.${key}`, oldValue: old, newValue: value, at: new Date().toISOString() },
    ];
    list[idx] = { ...before, indicadores, audit };
    write(list);
  },
  resetSeed() {
    localStorage.removeItem(KEY);
    seed();
    listeners.forEach((l) => l());
  },
};

import { useEffect, useState } from "react";
export function useGestantes() {
  const [list, setList] = useState<Gestante[]>(() => (typeof window === "undefined" ? [] : store.list()));
  useEffect(() => store.subscribe(() => setList(store.list())), []);
  return list;
}

export function useGestante(id: string | undefined) {
  const [g, setG] = useState<Gestante | undefined>(() => (id && typeof window !== "undefined" ? store.get(id) : undefined));
  useEffect(() => {
    if (!id) return;
    setG(store.get(id));
    return store.subscribe(() => setG(store.get(id)));
  }, [id]);
  return g;
}
