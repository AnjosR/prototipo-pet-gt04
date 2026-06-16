/**
 * Identificador da gestante no padrão do sistema:
 * iniciais dos dois primeiros nomes + "-" + os 3 dígitos do meio do CPF.
 * Ex.: "Maria Aparecida Silva" / "123.456.789-00" → "MA-456".
 */
export function gerarGestanteId(nome: string, cpf: string): string {
  const nomes = nome.trim().split(/\s+/).filter(Boolean);
  const iniciais =
    nomes
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "X";
  const digitos = cpf.replace(/\D/g, "");
  // Grupo do meio do CPF formatado (AAA.BBB.CCC-DD) → os dígitos B.
  const meio = digitos.slice(3, 6) || digitos.slice(0, 3);
  return `${iniciais}-${meio}`;
}

/**
 * Gera o ID garantindo unicidade frente aos identificadores já existentes.
 * Em caso de colisão, acrescenta um sufixo numérico (ex.: "MA-456-2").
 */
export function gerarGestanteIdUnico(nome: string, cpf: string, existentes: Set<string>): string {
  const base = gerarGestanteId(nome, cpf);
  if (!existentes.has(base)) return base;
  let n = 2;
  while (existentes.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
