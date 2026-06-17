# Status dos indicadores de contagem por idade gestacional

Data: 2026-06-17

## Problema

O badge de status dos indicadores de contagem (B = 7 consultas, C = 7 aferições de PA,
D = 7 medidas peso/altura) não corresponde ao progresso real da gestação. A regra atual
em `src/lib/indicators.ts` usa `expected = floor(semanas / 5)` e, sempre que
`n >= expected` (porém `n < 7`), retorna `"warn"` → o badge mostra "Próximo do vencimento".

Exemplo do problema: DUM 08/04/2026, hoje 17/06/2026 (~10 semanas). A gestante fez consulta
em abril, maio e junho (3 consultas). Pelo cronograma ela está **em dia**, mas o sistema
mostra "Próximo do vencimento". Inversamente, uma gestante no 5º mês com apenas 3 consultas
deveria aparecer como atrasada, e não como "próximo do vencimento".

## Objetivo

O status (cor + rótulo) dos indicadores B, C e D deve refletir se o número de
consultas/registros acumulados está adequado para a idade gestacional atual.

## Escopo

- Aplica-se aos indicadores **B, C e D** (todos `count`, `max = 7`).
- **Não** altera E (3 visitas ACS, regra própria por semanas), nem os indicadores boolean.

## Regra clínica (cronograma do Ministério da Saúde)

Número esperado de consultas/registros acumulados até a IG atual:

- 1 por mês até a 28ª semana (~1 a cada 4,345 semanas);
- a cada 15 dias entre a 28ª e a 36ª semana;
- semanal a partir da 36ª semana;
- teto no `max` do indicador (7).

## Design

### 1. `expectedPrenatalCount(weeks, max)` — `src/lib/indicators.ts`

```ts
/** Nº esperado de consultas/registros acumulados até a IG atual (cronograma MS). */
export function expectedPrenatalCount(weeks: number, max = 7): number {
  if (weeks < 4) return 0;
  let n = Math.floor(Math.min(weeks, 28) / 4.345);              // mensal até 28s
  if (weeks > 28) n += Math.floor((Math.min(weeks, 36) - 28) / 2); // quinzenal 28–36s
  if (weeks > 36) n += Math.floor(Math.min(weeks, 42) - 36);       // semanal 36s+
  return Math.min(n, max);
}
```

### 2. `indicatorStatus` — casos B, C e D

Substituir a lógica atual (`floor(w/5)`) pela comparação com o esperado:

```ts
case "B":
case "C":
case "D": {
  const n = Number(v) || 0;
  const expected = expectedPrenatalCount(w, 7);
  if (n >= expected) return "ok";       // atingiu o esperado p/ a IG → verde
  if (n >= expected - 1) return "warn"; // 1 abaixo → amarelo
  return "late";                         // 2+ abaixo → vermelho
}
```

### 3. Rótulos por tipo — `statusLabel` em `src/routes/gestante.$id.tsx`

`statusLabel` passa a receber o tipo do indicador. Para `count`:
`ok` = "Em dia", `warn` = "Levemente atrasado", `late` = "Em atraso", `na` = "Não aplicável".
Indicadores boolean mantêm os rótulos atuais ("Próximo do vencimento" / "Vencido").
A chamada do badge (linha ~279) passa `def.type`.

## Validação

DUM 08/04/2026, hoje 17/06/2026 → ~10 semanas:

- 3 consultas, esperado = `floor(10/4.345)` = 2 → `n ≥ esperado` → **Em dia** ✓
- 5º mês (~22 semanas), esperado = `floor(22/4.345)` = 5, com 3 consultas → 2 abaixo → **Em atraso** ✓
- 28 semanas → esperado = 6 (próximo da meta de 7) ✓
- 36 semanas → 6 + 4 = 10, limitado ao teto 7 ✓
