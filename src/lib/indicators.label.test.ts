import { describe, it, expect } from "vitest";
import { statusLabel } from "./indicators";

describe("statusLabel", () => {
  it("usa rótulos de atraso para indicadores de contagem", () => {
    expect(statusLabel("ok", "count")).toBe("Em dia");
    expect(statusLabel("warn", "count")).toBe("Levemente atrasado");
    expect(statusLabel("late", "count")).toBe("Em atraso");
    expect(statusLabel("na", "count")).toBe("Não aplicável");
  });

  it("mantém os rótulos de vencimento para boolean (default)", () => {
    expect(statusLabel("warn")).toBe("Próximo do vencimento");
    expect(statusLabel("late")).toBe("Vencido");
    expect(statusLabel("ok")).toBe("Em dia");
  });
});
