import { describe, it, expect } from "vitest";
import { expectedPrenatalCount } from "./indicators";

describe("expectedPrenatalCount", () => {
  it("retorna 0 antes da 4ª semana", () => {
    expect(expectedPrenatalCount(0)).toBe(0);
    expect(expectedPrenatalCount(3)).toBe(0);
  });

  it("conta ~1 por mês até a 28ª semana", () => {
    expect(expectedPrenatalCount(10)).toBe(2); // exemplo do usuário (~10s)
    expect(expectedPrenatalCount(22)).toBe(5); // ~5º mês
    expect(expectedPrenatalCount(28)).toBe(6);
  });

  it("acrescenta visitas quinzenais entre 28 e 36 semanas", () => {
    expect(expectedPrenatalCount(30)).toBe(7); // 6 + 1, limitado ao teto
  });

  it("nunca ultrapassa o teto informado", () => {
    expect(expectedPrenatalCount(40, 7)).toBe(7);
    expect(expectedPrenatalCount(40, 3)).toBe(3);
  });
});
