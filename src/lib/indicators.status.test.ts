import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { indicatorStatus, emptyIndicators } from "./indicators";
import type { Gestante } from "./types";

function makeGestante(dum: string, b: number): Gestante {
  return {
    id: "x",
    nome: "Teste",
    cpf: "",
    dataNascimento: "",
    endereco: "",
    telefone: "",
    cartaoSus: "",
    dum,
    microarea: "",
    primeiraConsulta: "",
    dataParto: "",
    indicadores: { ...emptyIndicators(), B: b },
    audit: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: "t",
  };
}

describe("indicatorStatus B/C/D por idade gestacional", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00")); // 70 dias após 08/04 → ~10s
  });
  afterEach(() => vi.useRealTimers());

  it("fica 'ok' quando atinge o esperado para a IG (3 consultas em ~10s)", () => {
    expect(indicatorStatus(makeGestante("2026-04-08", 3), "B")).toBe("ok");
    expect(indicatorStatus(makeGestante("2026-04-08", 2), "B")).toBe("ok");
  });

  it("fica 'warn' quando está 1 abaixo do esperado", () => {
    expect(indicatorStatus(makeGestante("2026-04-08", 1), "B")).toBe("warn");
  });

  it("fica 'late' quando está 2+ abaixo do esperado", () => {
    expect(indicatorStatus(makeGestante("2026-04-08", 0), "B")).toBe("late");
  });
});
