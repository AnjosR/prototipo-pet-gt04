# PRD — Sistema de Acompanhamento de Gestantes e Puérperas

> **Documento de Requisitos do Produto (Product Requirements Document)**
> Projeto: Protótipo PET — GT04
> Módulo: Gestante e Puerpério

---

## 1. Visão geral

Sistema web para **acompanhamento de gestantes e puérperas** vinculadas à Atenção Primária à Saúde (UBS/ESF), estruturado a partir dos **indicadores de saúde materna** (parametrizados pelo programa Previne Brasil / financiamento da APS). O objetivo é permitir que profissionais de saúde — **Médico/Enfermeiro, Dentista e Agente Comunitário de Saúde (ACS)** — registrem e visualizem, em um painel visual por cores, o cumprimento de 11 indicadores (A–K) ao longo do pré-natal e do puerpério, com cálculo automático de prazos a partir da Data da Última Menstruação (DUM).

O produto substitui o instrumento de acompanhamento em papel (ver `Modelo Telas - campos de dados.docx`) por uma ferramenta digital, responsiva e com controle de acesso por perfil.

### 1.1 Problema

O acompanhamento dos indicadores de gestantes hoje é feito em fichas/planilhas, o que dificulta:
- visualizar rapidamente quais indicadores estão **em dia, próximos do vencimento ou vencidos**;
- calcular manualmente Idade Gestacional (IG), Data Provável do Parto (DPP) e prazos de cada procedimento;
- garantir que cada profissional só altere o que é de sua responsabilidade;
- emitir alertas de prazos e rastrear quem alterou cada registro.

### 1.2 Objetivos do produto

1. Centralizar o cadastro e o acompanhamento de gestantes/puérperas.
2. Exibir os indicadores A–K em **painel matricial colorido** (verde/amarelo/vermelho).
3. **Calcular automaticamente** IG, DPP e prazos a partir da DUM.
4. Aplicar **controle de acesso por perfil** sobre o que cada usuário visualiza e edita.
5. Emitir **alertas** de indicadores vencidos ou próximos do vencimento.
6. Manter **log de auditoria** de todas as alterações na ficha.

---

## 2. Perfis de usuário

| Perfil | Descrição | Dispositivo típico |
|---|---|---|
| **Médico / Enfermeiro** | Perfil administrativo e clínico. Cadastra usuários e gestantes; visualiza e edita todos os indicadores. | Desktop (UBS) |
| **Dentista (Odontólogo)** | Profissional de saúde bucal. Visualiza a ficha; edita apenas o indicador de saúde bucal (K). | Desktop (UBS) |
| **ACS (Agente Comunitário de Saúde)** | Realiza visitas domiciliares. Visualiza a ficha; edita os indicadores de visitas (E e J). | Mobile / tablet (campo) |

### 2.1 Matriz de permissões (resumo)

| Ação | Médico/Enfermeiro | Dentista | ACS |
|---|:---:|:---:|:---:|
| Cadastrar usuários | ✅ | ❌ | ❌ |
| Cadastrar gestante | ✅ | ❌ | ❌ |
| Editar dados pessoais da gestante | ✅ | ❌ | ❌ |
| Visualizar painel/ficha | ✅ | ✅ | ✅ |
| Editar indicadores A, B, C, D, F, G, H, I | ✅ | ❌ | ❌ |
| Editar indicador **E** (visitas pré-natal) | ✅ | ❌ | ✅ |
| Editar indicador **J** (visita puerpério) | ✅ | ❌ | ✅ |
| Editar indicador **K** (saúde bucal) | ✅ | ✅ | ❌ |

> **Convenção do instrumento em papel:** cor neutra = "só visualiza (não cadastra)"; cor de destaque = "cadastra, visualiza, altera e/ou exclui".

---

## 3. Indicadores de acompanhamento (A–K)

Cada indicador representa uma meta do acompanhamento de pré-natal/puerpério. O tipo define a forma de registro (Sim/Não ou contagem) e o responsável define quem pode editá-lo.

| Chave | Descrição resumida | Tipo | Meta | Responsável |
|:---:|---|---|:---:|---|
| **A** | 1ª consulta (presencial/remota) por médico/enfermeiro até a 12ª semana de gestação | Sim/Não | até 12ª sem. | Médico/Enf. |
| **B** | Pelo menos 7 consultas de pré-natal por médico/enfermeiro durante a gestação | Contagem | ≥ 7 | Médico/Enf. |
| **C** | Pelo menos 7 aferições de pressão arterial durante a gestação | Contagem | ≥ 7 | Médico/Enf. |
| **D** | Pelo menos 7 registros simultâneos de peso e altura durante a gestação | Contagem | ≥ 7 | Médico/Enf. |
| **E** | Pelo menos 3 visitas domiciliares por ACS/TACS após a 1ª consulta do pré-natal | Contagem | ≥ 3 | **ACS** |
| **F** | Vacina dTpa (difteria, tétano, coqueluche) registrada a partir da 20ª semana | Sim/Não | a partir 20ª sem. | Médico/Enf. |
| **G** | Testes rápidos/exames para sífilis, HIV e hepatite B no 1º trimestre | Sim/Não | 1º trimestre | Médico/Enf. |
| **H** | Testes rápidos/exames para sífilis e HIV no 3º trimestre | Sim/Não | 3º trimestre | Médico/Enf. |
| **I** | Pelo menos 1 consulta por médico/enfermeiro durante o puerpério | Sim/Não | puerpério | Médico/Enf. |
| **J** | Pelo menos 1 visita domiciliar por ACS/TACS durante o puerpério | Sim/Não | puerpério | **ACS** |
| **K** | Pelo menos 1 atividade em saúde bucal (dentista/TSB) durante a gestação | Sim/Não | gestação | **Dentista** |

---

## 4. Requisitos funcionais

> Origem: `Requisitos do sistema.docx`. IDs preservados.

| ID | Requisito |
|---|---|
| **RF001** | Permitir o cadastro de usuários com perfis diferentes (Médico/Enfermeiro, Dentista e ACS). |
| **RF002** | Permitir o login de usuários autenticados. |
| **RF003** | Controlar o acesso às funcionalidades com base no perfil do usuário. |
| **RF004** | Adaptar a interface, exibindo apenas funcionalidades e informações permitidas ao perfil. |
| **RF005** | Permitir que **apenas** o perfil Médico/Enfermeiro cadastre novos usuários com diferentes perfis. |
| **RF006** | Permitir que **apenas** o perfil Médico/Enfermeiro cadastre novas gestantes, com os dados pessoais: Nome, CPF, Data de Nascimento, Endereço, Telefone, Cartão do SUS, DUM, IG, DPP, Microárea do ACS, Primeira Consulta (data) e Data do Parto. |
| **RF007** | Exibir um painel visual dos indicadores de saúde da gestante e puérpera em formato de matriz. |
| **RF008** | Permitir que o usuário registre/atualize o status dos indicadores selecionando a caixa correspondente e acessível ao seu perfil. |
| **RF009** | Representar o status dos indicadores por meio de cores (verde, amarelo e vermelho). |
| **RF010** | Alterar automaticamente a cor do indicador sempre que seu status mudar. |
| **RF011** | Calcular automaticamente a Idade Gestacional, a DPP e os prazos de cada indicador a partir da DUM. |
| **RF012** | Emitir alertas/notificações automáticas na tela dos usuários com perfil apropriado, mostrando os dados da paciente e do indicador com prazo vencido ou próximo do vencimento. |
| **RF013** | Permitir consultas com filtros personalizados: gestantes por área e microárea; indicadores por status (realizado, vencido ou próximo do vencimento); ACS (visitas realizadas e pendentes); etc. |

---

## 5. Requisitos não funcionais

> Origem: `Requisitos do sistema.docx`.

| ID | Categoria | Requisito |
|---|---|---|
| **RNF001** | Portabilidade | Interface responsiva, com operação adequada em desktop (UBS) e dispositivos móveis (smartphone/tablet do ACS). |
| **RNF002** | Usabilidade | Interface clara e de fácil utilização. |
| **RNF003** | Desempenho | Carregar a ficha da gestante, calcular a IG e renderizar as cores em **menos de 2 segundos**. |
| **RNF004** | Segurança | Autenticação segura; senhas armazenadas com **criptografia** no banco; controle de acesso baseado em perfis. |
| **RNF005** | Disponibilidade | Disponível 24/7; exibir mensagens amigáveis de "falha de conexão" em caso de oscilação/queda de internet nas microáreas. |
| **RNF006** | Segurança/Auditoria | Registrar **log de auditoria** de cada alteração na ficha: usuário, data, hora e qual caixa de indicador foi alterada. |
| **RNF007** | Compliance (LGPD) | Conformidade com a LGPD para os dados de identificação pessoal (CPF, Cartão SUS, Data de Nascimento), garantindo trânsito seguro. |

---

## 6. Regras de negócio

### 6.1 Cálculos a partir da DUM
- **Idade Gestacional (IG):** diferença em dias entre a data atual e a DUM, expressa em semanas + dias (`ⁿs ⁿd`).
- **DPP (Data Provável do Parto):** regra de Naegele — `DUM + 280 dias`.
- O **puerpério** é considerado a partir do registro da **Data do Parto**.

### 6.2 Status e cores dos indicadores
Cada indicador assume um de quatro status, traduzidos em cor:

| Status | Cor | Significado |
|---|---|---|
| `ok` | 🟢 Verde | Meta atingida / em dia |
| `warn` | 🟡 Amarelo | Próximo do vencimento |
| `late` | 🔴 Vermelho | Vencido / atrasado |
| `na` | ⚪ Neutro | Ainda não aplicável (fora da janela gestacional) |

Regras de transição vigentes no protótipo (resumo — ver `src/lib/indicators.ts`):
- **A:** verde se realizado; amarelo até a 12ª semana; vermelho depois.
- **B/C/D:** verde com ≥7; compara o valor com o esperado (~1 a cada 5 semanas) para amarelo/vermelho.
- **E:** verde com ≥3; amarelo até a 12ª semana; vermelho depois.
- **F:** não aplicável antes da 20ª semana; amarelo entre 20ª–28ª; vermelho depois.
- **G:** verde se realizado; amarelo até a 13ª semana; vermelho depois.
- **H:** não aplicável antes da 28ª semana; amarelo entre 28ª–36ª; vermelho depois.
- **I/J:** verde se realizado; não aplicável antes do parto; vermelho após o parto se não realizado.
- **K:** verde se realizado; amarelo até a 20ª semana; vermelho depois.

> As janelas de prazo acima são heurísticas do protótipo e devem ser **validadas com a área de saúde** antes da homologação.

### 6.3 Auditoria
Toda alteração de dado pessoal ou de indicador gera um registro de auditoria com: usuário, perfil, campo alterado, valor antigo, valor novo e timestamp (RNF006).

---

## 7. Modelo de dados (conceitual)

Baseado em `src/lib/types.ts`.

### Usuário (`User`)
`username`, `password` (a ser criptografada — RNF004), `role` (`medico` | `acs` | `dentista`), `displayName`.

### Gestante (`Gestante`)
`id`, `nome`, `cpf`, `dataNascimento`, `endereco`, `telefone`, `cartaoSus`, `dum`, `microarea` (ACS responsável), `primeiraConsulta`, `dataParto`, `indicadores` (A–K), `audit[]`, `createdAt`, `createdBy`.

### Indicadores (`Indicators`)
- `A`, `F`, `G`, `H`, `I`, `J`, `K`: `boolean | null` (Sim/Não/não informado).
- `B`, `C`, `D`: `number` (0–7).
- `E`: `number` (0–3).

### Registro de auditoria (`AuditEntry`)
`user`, `role`, `field`, `oldValue`, `newValue`, `at` (ISO).

---

## 8. Telas (visões por perfil)

> Origem: `Modelo Telas - campos de dados.docx` e `Esboço da proposta alternativa - Gustavo.pdf`.

1. **Login** — autenticação por usuário e senha.
2. **Painel de gestantes (Dashboard)** — matriz com cada gestante e seus indicadores A–K coloridos; cartões-resumo (em dia / próximos do vencimento / vencidos / total); filtros por busca, microárea e status (RF007, RF013).
3. **Cadastro de gestante** (Médico/Enfermeiro) — formulário com todos os dados pessoais (RF006).
4. **Ficha da gestante** — dados pessoais (com IG/DPP calculados), lista de indicadores A–K editáveis conforme o perfil, e histórico de alterações (auditoria).
5. **Cadastro de usuários** (Médico/Enfermeiro) — *a implementar* (RF001, RF005).
6. **Cabeçalho comum da ficha (todos os perfis):** Nome, CPF, Data de Nascimento, Endereço, Telefone, Cartão SUS, DUM, IG, DPP, Microárea/ACS, Primeira Consulta, Data do Parto.

### 8.1 Visão por perfil
- **Médico/Enfermeiro:** todos os campos e indicadores, com edição.
- **ACS:** todos os campos em leitura; edita os indicadores **E** e **J**.
- **Dentista:** todos os campos em leitura; edita o indicador **K**.

---

## 9. Estado atual do protótipo (análise do código)

### 9.1 Stack técnica
- **Framework:** TanStack Start + TanStack Router/Query (React 19, Vite 8).
- **UI:** Tailwind CSS v4 + componentes shadcn/ui (Radix UI), ícones lucide-react, toasts via sonner.
- **Formulários/validação:** react-hook-form + zod.
- **Datas:** date-fns + utilitários próprios (`src/lib/gestacao.ts`).
- **Persistência atual:** `localStorage` (mock), sem backend.

### 9.2 Já implementado
- Login com usuários **fixos em código** e sessão em `localStorage` (`src/lib/auth.tsx`).
- Painel de gestantes com matriz colorida, cartões-resumo e filtros (busca, microárea, status) — `src/routes/dashboard.tsx`.
- Ficha da gestante com edição de dados, edição de indicadores por perfil e histórico de auditoria — `src/routes/gestante.$id.tsx`.
- Cadastro de gestante (`src/routes/gestante.nova.tsx`).
- Cálculo de IG e DPP (`src/lib/gestacao.ts`).
- Lógica de status/cores e permissões de edição por indicador (`src/lib/indicators.ts`).
- Dados de exemplo (seed) e store em memória/`localStorage` (`src/lib/store.ts`).

### 9.3 Lacunas (gap analysis) frente aos requisitos
| Requisito | Situação | Observação |
|---|---|---|
| RF001 / RF005 | ⚠️ Pendente | Não há tela de cadastro de usuários; usuários são fixos no código. |
| RF002 / RF004 | ✅ Parcial | Login e adaptação de UI por perfil existem (mock). |
| RF012 | ⚠️ Pendente | Não há tela de alertas/notificações automáticas de prazos. |
| RNF004 | ❌ Pendente | Senhas em texto plano no código; sem criptografia nem backend de autenticação. |
| RNF005 | ❌ Pendente | Sem backend; "modo offline / falha de conexão" não tratado. |
| RNF006 | ✅ Parcial | Auditoria registrada no objeto da gestante (local), sem persistência segura. |
| RNF007 | ⚠️ Pendente | LGPD depende de backend/banco; hoje os dados ficam apenas no navegador. |
| Backend/Banco | ❌ Pendente | Persistência é `localStorage`; não há API nem banco de dados. |

---

## 10. Divergências e pontos em aberto

1. **Visão do Dentista — campos exibidos.** O `Modelo Telas` sugere que o Dentista veja **apenas o campo K**; a proposta do Gustavo (PDF) indica para o Odontólogo *"repetir todos os campos, somente visualização, exceto os itens E e J que podem ser alterados pelo ACS"*. O protótipo segue a segunda leitura (Dentista vê todos os indicadores em leitura e edita K). **Decisão pendente.**
2. **Anotações trocadas no PDF do Gustavo.** A nota da página do **ACS** diz "INCLUIR APENAS CAMPO K" (que descreve melhor o Dentista), enquanto a nota do **Odontólogo** descreve a edição de E e J (própria do ACS). Os textos parecem invertidos entre as páginas — **confirmar com o autor**.
3. **Janelas de prazo dos indicadores.** As regras de amarelo/vermelho em `indicators.ts` são heurísticas e precisam de **validação clínica**.
4. **Autenticação e LGPD.** Exigem backend com armazenamento criptografado de senhas e banco em conformidade — não contemplados no protótipo atual.

---

## 11. Próximos passos sugeridos

1. Validar com a equipe as divergências da seção 10 (especialmente a visão do Dentista).
2. Definir backend e banco de dados (persistência, autenticação criptografada, auditoria e LGPD — RNF004/006/007).
3. Implementar cadastro de usuários (RF001/RF005).
4. Implementar a central de alertas/notificações de prazos (RF012).
5. Validar clinicamente as regras de prazo dos indicadores (seção 6.2).
6. Tratar modo offline / mensagens de falha de conexão (RNF005).

---

*Documento gerado a partir dos arquivos em `docs/arquivos-repassados/` e da análise do código do protótipo. Atualize-o conforme as decisões forem tomadas.*
