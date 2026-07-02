import { createFileRoute, Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth, roleLabel } from "@/lib/auth";
import { store, useGestante } from "@/lib/store";
import {
  INDICATORS,
  visibleIndicatorsFor,
  canEditIndicator,
  indicatorStatus,
  statusColor,
  statusLabel,
  type IndicatorDef,
} from "@/lib/indicators";
import { calcDPP, formatDate, formatIG } from "@/lib/gestacao";
import type { Gestante, IndicatorKey, Indicators } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Lock, Pencil, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/gestante/$id")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <GestanteDetail />
      </AppShell>
    </RequireAuth>
  ),
});

function GestanteDetail() {
  const { id } = Route.useParams();
  const g = useGestante(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editingPatient, setEditingPatient] = useState(false);
  // Rascunho dos indicadores: os controles editam apenas este estado local;
  // nada é gravado no store até o usuário clicar em "Salvar alterações".
  const [draft, setDraft] = useState<Indicators | null>(null);

  // Ressincroniza o rascunho com o valor salvo. Como os controles só mexem no
  // rascunho, `indicadores` só muda de referência quando salvamos — então isto
  // zera o "dirty" após um salvamento, sem descartar edições em andamento.
  const savedIndicators = g?.indicadores;
  useEffect(() => {
    if (savedIndicators) setDraft(savedIndicators);
  }, [savedIndicators]);

  const dirty =
    !!g && !!draft && INDICATORS.some((def) => draft[def.key] !== g.indicadores[def.key]);

  // Intercepta TODA navegação para fora da rota enquanto houver alterações não
  // salvas: botão Voltar, links do cabeçalho, logout e o back/forward do
  // navegador. `enableBeforeUnload` cobre fechar/recarregar a aba (aviso nativo,
  // só disparado quando há alterações).
  const { status, proceed, reset } = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    withResolver: true,
  });

  const saveIndicators = () => {
    if (!g || !user || !draft) return;
    INDICATORS.forEach((def) => {
      if (draft[def.key] !== g.indicadores[def.key] && canEditIndicator(user.role, def.key)) {
        store.setIndicator(g.id, def.key, draft[def.key], {
          user: user.username,
          role: user.role,
        });
      }
    });
    toast.success("Alterações salvas.");
  };

  if (!g) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Gestante não encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>
          Voltar
        </Button>
      </div>
    );
  }
  if (!user) return null;

  // Cada perfil enxerga apenas os indicadores que remetem ao seu contexto:
  // médico vê todos; ACS vê E e J; dentista vê K.
  const visibleIndicators = visibleIndicatorsFor(user.role);
  const setDraftValue = (key: IndicatorKey) => (v: Indicators[IndicatorKey]) =>
    setDraft((d) => (d ? { ...d, [key]: v } : d));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-xl">{g.id}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastrada em {formatDate(g.createdAt.slice(0, 10))}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {editingPatient ? (
            <PatientEditForm g={g} onDone={() => setEditingPatient(false)} />
          ) : (
            <PatientView g={g} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Indicadores de acompanhamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleIndicators.map((def) => (
            <IndicatorRow
              key={def.key}
              def={def}
              g={g}
              value={draft ? draft[def.key] : g.indicadores[def.key]}
              onChange={setDraftValue(def.key)}
            />
          ))}
          <div className="flex justify-end pt-2">
            <Button
              onClick={saveIndicators}
              disabled={!dirty}
              className="disabled:pointer-events-auto disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmação ao tentar sair com alterações pendentes (qualquer rota). */}
      <AlertDialog
        open={status === "blocked"}
        onOpenChange={(open) => {
          if (!open) reset?.();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              ALTERAÇÕES NÃO FORAM SALVAS, deseja salvar e continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => proceed?.()}>
              Não
            </Button>
            <Button
              onClick={() => {
                saveIndicators();
                proceed?.();
              }}
            >
              Sim
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PatientView({ g }: { g: Gestante }) {
  const { user } = useAuth();
  // Cada perfil enxerga apenas as informações pertinentes ao seu contexto.
  let rows: [string, string][];
  if (user?.role === "acs") {
    // O ACS atua em campo: por privacidade, vê apenas o endereço.
    rows = [["DPP", formatDate(calcDPP(g.dum) ?? undefined)]];
  } else {
    // Médico/Enfermeiro e Dentista: resumo clínico
    // (dados pessoais completos ficam no formulário de edição).
    rows = [
      ["Nome Completo", g.nome],
      ["Data de Nascimento", formatDate(g.dataNascimento)],
      ["Endereço", g.endereco],
      ["DUM", formatDate(g.dum)],
      ["IG atual", formatIG(g.dum)],
      ["DPP", formatDate(calcDPP(g.dum) ?? undefined)],
      ["1ª consulta", formatDate(g.primeiraConsulta)],
    ];
  }
  return (
    <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function PatientEditForm({ g, onDone }: { g: Gestante; onDone: () => void }) {
  const { user } = useAuth();
  const [f, setF] = useState({
    nome: g.nome,
    cpf: g.cpf,
    dataNascimento: g.dataNascimento,
    endereco: g.endereco,
    telefone: g.telefone,
    cartaoSus: g.cartaoSus,
    dum: g.dum,
    microarea: g.microarea,
    primeiraConsulta: g.primeiraConsulta,
    dataParto: g.dataParto,
  });
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));
  const save = () => {
    if (!user) return;
    store.updatePatient(g.id, f, { user: user.username, role: user.role });
    toast.success("Dados atualizados.");
    onDone();
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Mini label="Nome" className="md:col-span-3">
        <Input value={f.nome} onChange={upd("nome")} />
      </Mini>
      <Mini label="CPF">
        <Input value={f.cpf} onChange={upd("cpf")} />
      </Mini>
      <Mini label="Data nascimento">
        <Input type="date" value={f.dataNascimento} onChange={upd("dataNascimento")} />
      </Mini>
      <Mini label="Telefone">
        <Input value={f.telefone} onChange={upd("telefone")} />
      </Mini>
      <Mini label="Endereço" className="md:col-span-2">
        <Input value={f.endereco} onChange={upd("endereco")} />
      </Mini>
      <Mini label="Cartão SUS">
        <Input value={f.cartaoSus} onChange={upd("cartaoSus")} />
      </Mini>
      <Mini label="DUM">
        <Input type="date" value={f.dum} onChange={upd("dum")} />
      </Mini>
      <Mini label="Microárea / ACS">
        <Input value={f.microarea} onChange={upd("microarea")} />
      </Mini>
      <Mini label="1ª consulta">
        <Input type="date" value={f.primeiraConsulta} onChange={upd("primeiraConsulta")} />
      </Mini>
      <Mini label="Data do parto">
        <Input type="date" value={f.dataParto} onChange={upd("dataParto")} />
      </Mini>
      <div className="md:col-span-3 flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button onClick={save}>
          <Save className="h-4 w-4 mr-1" />
          Salvar
        </Button>
      </div>
    </div>
  );
}

function Mini({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function IndicatorRow({
  def,
  g,
  value,
  onChange,
}: {
  def: IndicatorDef;
  g: Gestante;
  value: Indicators[IndicatorKey];
  onChange: (v: Indicators[IndicatorKey]) => void;
}) {
  const { user } = useAuth();
  const editable = !!user && canEditIndicator(user.role, def.key);
  // O status reflete o valor em edição (rascunho), não o salvo.
  const status = indicatorStatus(
    { ...g, indicadores: { ...g.indicadores, [def.key]: value } },
    def.key,
  );

  const setVal = (v: Indicators[IndicatorKey]) => {
    if (!editable) return;
    onChange(v);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 border rounded-lg p-3 bg-card">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span
          className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center font-semibold ${statusColor(status)}`}
        >
          {def.key}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{def.short}</div>
          <p className="text-xs text-muted-foreground">{def.label}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Responsável: {roleLabel[def.owner]}</Badge>
            <Badge variant="outline" className={statusColor(status)}>
              {statusLabel(status, def.type)}
            </Badge>
          </div>
        </div>
      </div>
      <div className="md:w-auto">
        {def.type === "boolean" ? (
          <BoolControl value={value as boolean | null} editable={editable} onChange={setVal} />
        ) : (
          <CountControl
            value={(value as number) ?? 0}
            max={def.max ?? 7}
            editable={editable}
            onChange={setVal}
          />
        )}
        {!editable && (
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-1">
            <Lock className="h-3 w-3" />
            Somente leitura
          </div>
        )}
      </div>
    </div>
  );
}

function BoolControl({
  value,
  editable,
  onChange,
}: {
  value: boolean | null;
  editable: boolean;
  onChange: (v: boolean | null) => void;
}) {
  const btn = (label: string, v: boolean, active: boolean) => (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      disabled={!editable}
      onClick={() => onChange(active ? null : v)}
    >
      {label}
    </Button>
  );
  return (
    <div className="flex gap-2 justify-end">
      {btn("Sim", true, value === true)}
      {btn("Não", false, value === false)}
    </div>
  );
}

function CountControl({
  value,
  max,
  editable,
  onChange,
}: {
  value: number;
  max: number;
  editable: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {Array.from({ length: max + 1 }, (_, i) => i).map((n) => (
        <Button
          key={n}
          type="button"
          size="sm"
          variant={value === n ? "default" : "outline"}
          className="w-9 px-0"
          disabled={!editable}
          onClick={() => onChange(n)}
        >
          {n}
        </Button>
      ))}
    </div>
  );
}

const PATIENT_FIELD_LABELS: Record<string, string> = {
  nome: "Nome",
  cpf: "CPF",
  dataNascimento: "Data de nascimento",
  endereco: "Endereço",
  telefone: "Telefone",
  cartaoSus: "Cartão SUS",
  dum: "DUM",
  microarea: "Microárea / ACS",
  primeiraConsulta: "1ª consulta",
  dataParto: "Data do parto",
};

function auditFieldLabel(field: string): string {
  if (field.startsWith("indicador.")) {
    const key = field.split(".")[1] as IndicatorKey;
    const def = INDICATORS.find((i) => i.key === key);
    return def ? `${key} · ${def.short}` : `Indicador ${key}`;
  }
  return PATIENT_FIELD_LABELS[field] ?? field;
}

function auditValueLabel(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDate(value);
  return String(value);
}
