import type { AuditEntry, Gestante, IndicatorKey, Indicators } from "./types";
import { emptyIndicators } from "./indicators";
import { gerarGestanteIdUnico } from "./gestante-id";
import seedData from "@/data/gestantes.seed.json";

const KEY = "ubs.gestantes.v1";

/** Estrutura de cada gestante fictícia no JSON de seed. As datas são
 *  armazenadas como deslocamentos em dias a partir de hoje, para que os
 *  dados de demonstração permaneçam coerentes com a Idade Gestacional. */
interface SeedGestante {
  nome: string;
  cpf: string;
  dataNascimento: string;
  endereco: string;
  telefone: string;
  cartaoSus: string;
  dumOffsetDays: number;
  microarea: string;
  primeiraConsultaOffsetDays: number;
  dataPartoOffsetDays: number | null;
  indicadores: Partial<Indicators>;
}

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
  const nowIso = new Date().toISOString();
  const usados = new Set<string>();
  const list: Gestante[] = (seedData as SeedGestante[]).map((s) => {
    const id = gerarGestanteIdUnico(s.nome, s.cpf, usados);
    usados.add(id);
    return {
      id,
      nome: s.nome,
      cpf: s.cpf,
      dataNascimento: s.dataNascimento,
      endereco: s.endereco,
      telefone: s.telefone,
      cartaoSus: s.cartaoSus,
      dum: mk(s.dumOffsetDays),
      microarea: s.microarea,
      primeiraConsulta: mk(s.primeiraConsultaOffsetDays),
      dataParto: s.dataPartoOffsetDays == null ? "" : mk(s.dataPartoOffsetDays),
      indicadores: { ...emptyIndicators(), ...s.indicadores },
      audit: [],
      createdAt: nowIso,
      createdBy: "seed",
    };
  });
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export const store = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  list(): Gestante[] {
    return read();
  },
  get(id: string): Gestante | undefined {
    return read().find((g) => g.id === id);
  },
  create(g: Omit<Gestante, "id" | "indicadores" | "audit" | "createdAt">): Gestante {
    const list = read();
    const usados = new Set(list.map((x) => x.id));
    const novo: Gestante = {
      ...g,
      id: gerarGestanteIdUnico(g.nome, g.cpf, usados),
      indicadores: emptyIndicators(),
      audit: [],
      createdAt: new Date().toISOString(),
    };
    list.unshift(novo);
    write(list);
    return novo;
  },
  updatePatient(
    id: string,
    patch: Partial<Gestante>,
    by: { user: string; role: Gestante["audit"][number]["role"] },
  ) {
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
          user: by.user,
          role: by.role,
          field: key,
          oldValue: (before as any)[key],
          newValue: (after as any)[key],
          at: new Date().toISOString(),
        });
      }
    });
    after.audit = audit;
    list[idx] = after;
    write(list);
  },
  setIndicator(
    id: string,
    key: IndicatorKey,
    value: Indicators[IndicatorKey],
    by: { user: string; role: AuditEntry["role"] },
  ) {
    const list = read();
    const idx = list.findIndex((g) => g.id === id);
    if (idx < 0) return;
    const before = list[idx];
    const old = before.indicadores[key];
    if (old === value) return;
    const indicadores = { ...before.indicadores, [key]: value } as Indicators;
    const audit: AuditEntry[] = [
      ...before.audit,
      {
        user: by.user,
        role: by.role,
        field: `indicador.${key}`,
        oldValue: old,
        newValue: value,
        at: new Date().toISOString(),
      },
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
  const [list, setList] = useState<Gestante[]>(() =>
    typeof window === "undefined" ? [] : store.list(),
  );
  useEffect(() => store.subscribe(() => setList(store.list())), []);
  return list;
}

export function useGestante(id: string | undefined) {
  const [g, setG] = useState<Gestante | undefined>(() =>
    id && typeof window !== "undefined" ? store.get(id) : undefined,
  );
  useEffect(() => {
    if (!id) return;
    setG(store.get(id));
    return store.subscribe(() => setG(store.get(id)));
  }, [id]);
  return g;
}
