# Status dos indicadores de contagem por idade gestacional — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o badge de status dos indicadores B, C e D refletir se o número de consultas/registros está adequado à idade gestacional atual, em vez do rótulo fixo "Próximo do vencimento".

**Architecture:** Adiciona uma função pura `expectedPrenatalCount(weeks, max)` em `src/lib/indicators.ts` que traduz o cronograma do MS em nº esperado de consultas. `indicatorStatus` passa a comparar o valor com o esperado para B/C/D. `statusLabel` é movida para `indicators.ts`, recebe o tipo do indicador e usa rótulos próprios para `count`.

**Tech Stack:** TypeScript, React, TanStack Router, Vitest (novo, para testar a lógica pura).

## Global Constraints

- Indicadores afetados: **B, C e D** somente (todos `type: "count"`, `max: 7`). E e os boolean ficam inalterados.
- Cronograma do MS: 1/mês até 28s; a cada 15 dias de 28–36s; semanal de 36s+; teto no `max`.
- Status existentes: `"ok" | "warn" | "late" | "na"` (não criar novos status; só mudar rótulos por tipo).
- Idioma do código/rótulos: português com acentuação correta.
- Imports de teste usam caminho relativo (`./indicators`), sem depender do alias `@`.

---

### Task 1: Setup do Vitest + `expectedPrenatalCount`

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts + devDependency)
- Modify: `src/lib/indicators.ts`
- Test: `src/lib/indicators.expected.test.ts`

**Interfaces:**
- Produces: `expectedPrenatalCount(weeks: number, max?: number): number` — nº esperado de consultas/registros acumulados até a IG, limitado a `max` (default 7).

- [ ] **Step 1: Instalar o Vitest**

Run: `npm install -D vitest`
Expected: instala `vitest` em `devDependencies`.

- [ ] **Step 2: Criar `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Adicionar o script de teste em `package.json`**

Em `"scripts"`, adicionar:

```json
    "test": "vitest run",
```

- [ ] **Step 4: Escrever o teste que falha** (`src/lib/indicators.expected.test.ts`)

```ts
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
```

- [ ] **Step 5: Rodar o teste e confirmar a falha**

Run: `npm test`
Expected: FAIL — `expectedPrenatalCount` não está exportada.

- [ ] **Step 6: Implementar `expectedPrenatalCount` em `src/lib/indicators.ts`**

Adicionar logo após a função `emptyIndicators` (antes de `export type Status`):

```ts
/**
 * Nº esperado de consultas/registros acumulados até a IG atual, segundo o
 * cronograma do MS: 1/mês até a 28ª semana; a cada 15 dias entre 28–36s;
 * semanal a partir da 36ª. Limitado ao teto `max` do indicador.
 */
export function expectedPrenatalCount(weeks: number, max = 7): number {
  if (weeks < 4) return 0;
  let n = Math.floor(Math.min(weeks, 28) / 4.345); // mensal até 28s
  if (weeks > 28) n += Math.floor((Math.min(weeks, 36) - 28) / 2); // quinzenal 28–36s
  if (weeks > 36) n += Math.floor(Math.min(weeks, 42) - 36); // semanal 36s+
  return Math.min(n, max);
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `npm test`
Expected: PASS (4 testes).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/indicators.ts src/lib/indicators.expected.test.ts
git commit -m "feat: add expectedPrenatalCount e setup do vitest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `indicatorStatus` compara B/C/D com o esperado

**Files:**
- Modify: `src/lib/indicators.ts:122-136` (casos `"B"` e `"C"`/`"D"`)
- Test: `src/lib/indicators.status.test.ts`

**Interfaces:**
- Consumes: `expectedPrenatalCount` (Task 1), `indicatorStatus(g: Gestante, key: IndicatorKey): Status`.
- Produces: comportamento atualizado de `indicatorStatus` para B/C/D.

- [ ] **Step 1: Escrever o teste que falha** (`src/lib/indicators.status.test.ts`)

```ts
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
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL — com a regra atual (`floor(w/5)`=2), B=2 e B=3 retornam `"warn"`, não `"ok"`.

- [ ] **Step 3: Atualizar os casos B/C/D em `src/lib/indicators.ts`**

Substituir os blocos atuais dos `case "B"` (linhas ~122-128) e `case "C": case "D"` (linhas ~129-136) por um único bloco:

```ts
    case "B":
    case "C":
    case "D": {
      const n = Number(v) || 0;
      const expected = expectedPrenatalCount(w, 7);
      if (n >= expected) return "ok"; // atingiu o esperado p/ a IG → verde
      if (n >= expected - 1) return "warn"; // 1 abaixo → amarelo
      return "late"; // 2+ abaixo → vermelho
    }
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS (todos os testes das Tasks 1 e 2).

- [ ] **Step 5: Commit**

```bash
git add src/lib/indicators.ts src/lib/indicators.status.test.ts
git commit -m "feat: status de B/C/D baseado no esperado para a idade gestacional

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `statusLabel` por tipo, movida para `indicators.ts`

**Files:**
- Modify: `src/lib/indicators.ts` (adicionar `statusLabel`)
- Modify: `src/routes/gestante.$id.tsx` (remover a `statusLabel` local; importar de `@/lib/indicators`; passar `def.type` na chamada)
- Test: `src/lib/indicators.label.test.ts`

**Interfaces:**
- Consumes: `Status` (de `indicators.ts`), `IndicatorType` (de `indicators.ts`).
- Produces: `statusLabel(s: Status, type?: IndicatorType): string`.

- [ ] **Step 1: Escrever o teste que falha** (`src/lib/indicators.label.test.ts`)

```ts
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
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test`
Expected: FAIL — `statusLabel` não está exportada de `./indicators`.

- [ ] **Step 3: Adicionar `statusLabel` em `src/lib/indicators.ts`**

Inserir logo após a função `statusColor`:

```ts
export function statusLabel(s: Status, type: IndicatorType = "boolean"): string {
  if (type === "count") {
    return s === "ok"
      ? "Em dia"
      : s === "warn"
        ? "Levemente atrasado"
        : s === "late"
          ? "Em atraso"
          : "Não aplicável";
  }
  return s === "ok"
    ? "Em dia"
    : s === "warn"
      ? "Próximo do vencimento"
      : s === "late"
        ? "Vencido"
        : "Não aplicável";
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS (todos os testes).

- [ ] **Step 5: Remover a `statusLabel` local em `src/routes/gestante.$id.tsx`**

Apagar o bloco (linhas ~364-372):

```ts
function statusLabel(s: string) {
  return s === "ok"
    ? "Em dia"
    : s === "warn"
      ? "Próximo do vencimento"
      : s === "late"
        ? "Vencido"
        : "Não aplicável";
}
```

- [ ] **Step 6: Importar `statusLabel` de `@/lib/indicators`**

No import existente de `@/lib/indicators` (linhas 6-13), adicionar `statusLabel` à lista:

```ts
import {
  INDICATORS,
  visibleIndicatorsFor,
  canEditIndicator,
  indicatorStatus,
  statusColor,
  statusLabel,
  type IndicatorDef,
} from "@/lib/indicators";
```

- [ ] **Step 7: Passar `def.type` na chamada do badge**

Na linha ~279, trocar `{statusLabel(status)}` por:

```tsx
              {statusLabel(status, def.type)}
```

- [ ] **Step 8: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros (a `statusLabel` local foi removida e a importada é usada).

- [ ] **Step 9: Rodar todos os testes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/lib/indicators.ts src/routes/gestante.\$id.tsx src/lib/indicators.label.test.ts
git commit -m "feat: rótulos de status por tipo de indicador no badge da gestante

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- `expectedPrenatalCount` (cronograma MS) → Task 1 ✓
- `indicatorStatus` para B/C/D comparando com o esperado → Task 2 ✓
- Rótulos por tipo em `statusLabel` + chamada com `def.type` → Task 3 ✓
- Validação dos exemplos (10s/3 consultas → Em dia; 22s/3 consultas → Em atraso) → testes nas Tasks 1 e 2 ✓

**Placeholder scan:** sem TBD/TODO; todo passo tem código/comando concreto.

**Type consistency:** `expectedPrenatalCount(weeks, max)`, `indicatorStatus(g, key): Status`, `statusLabel(s: Status, type?: IndicatorType): string` consistentes entre tarefas; `IndicatorType` e `Status` já existem em `indicators.ts`.

**Nota de design:** o spec previa `statusLabel` em `gestante.$id.tsx`; o plano a move para `indicators.ts` para co-localizar com `statusColor`/`indicatorStatus` e torná-la testável — melhoria pequena e alinhada ao objetivo.
