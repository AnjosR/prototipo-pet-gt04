import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth, roleLabel } from "@/lib/auth";
import { store, useGestante } from "@/lib/store";
import { INDICATORS, visibleIndicatorsFor, canEditIndicator, indicatorStatus, statusColor, type IndicatorDef } from "@/lib/indicators";
import { calcDPP, formatDate, formatIG } from "@/lib/gestacao";
import type { Gestante, IndicatorKey, Indicators } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
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

  if (!g) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Gestante não encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>Voltar</Button>
      </div>
    );
  }
  if (!user) return null;

  const canEditPatient = user.role === "medico";

  // Cada perfil enxerga apenas os indicadores que remetem ao seu contexto:
  // médico vê todos; ACS vê E e J; dentista vê K.
  const visibleIndicators = visibleIndicatorsFor(user.role);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="h-4 w-4 mr-1" />Voltar
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-xl">{g.nome}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Cadastrada em {formatDate(g.createdAt.slice(0, 10))}</p>
          </div>
          {canEditPatient && !editingPatient && (
            <Button variant="outline" size="sm" onClick={() => setEditingPatient(true)}><Pencil className="h-4 w-4 mr-1" />Editar dados</Button>
          )}
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
            <IndicatorRow key={def.key} def={def} g={g} />
          ))}
        </CardContent>
      </Card>

      {g.audit.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Histórico de alterações</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3 max-h-72 overflow-auto pr-1">
              {[...g.audit].reverse().map((a, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                  <div className="min-w-0">
                    <p className="leading-snug">
                      <span className="font-medium">{auditFieldLabel(a.field)}</span>
                      {" → "}
                      <span className="font-medium">{auditValueLabel(a.newValue)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.user} · {new Date(a.at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PatientView({ g }: { g: Gestante }) {
  const rows: [string, string][] = [
    ["CPF", g.cpf || "—"],
    ["Data de nascimento", formatDate(g.dataNascimento)],
    ["Telefone", g.telefone || "—"],
    ["Cartão SUS", g.cartaoSus || "—"],
    ["Endereço", g.endereco || "—"],
    ["Microárea / ACS", g.microarea || "—"],
    ["DUM", formatDate(g.dum)],
    ["IG atual", formatIG(g.dum)],
    ["DPP", formatDate(calcDPP(g.dum) ?? undefined)],
    ["1ª consulta", formatDate(g.primeiraConsulta)],
    ["Data do parto", formatDate(g.dataParto)],
  ];
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
    nome: g.nome, cpf: g.cpf, dataNascimento: g.dataNascimento, endereco: g.endereco,
    telefone: g.telefone, cartaoSus: g.cartaoSus, dum: g.dum, microarea: g.microarea,
    primeiraConsulta: g.primeiraConsulta, dataParto: g.dataParto,
  });
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = () => {
    if (!user) return;
    store.updatePatient(g.id, f, { user: user.username, role: user.role });
    toast.success("Dados atualizados.");
    onDone();
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Mini label="Nome" className="md:col-span-3"><Input value={f.nome} onChange={upd("nome")} /></Mini>
      <Mini label="CPF"><Input value={f.cpf} onChange={upd("cpf")} /></Mini>
      <Mini label="Data nascimento"><Input type="date" value={f.dataNascimento} onChange={upd("dataNascimento")} /></Mini>
      <Mini label="Telefone"><Input value={f.telefone} onChange={upd("telefone")} /></Mini>
      <Mini label="Endereço" className="md:col-span-2"><Input value={f.endereco} onChange={upd("endereco")} /></Mini>
      <Mini label="Cartão SUS"><Input value={f.cartaoSus} onChange={upd("cartaoSus")} /></Mini>
      <Mini label="DUM"><Input type="date" value={f.dum} onChange={upd("dum")} /></Mini>
      <Mini label="Microárea / ACS"><Input value={f.microarea} onChange={upd("microarea")} /></Mini>
      <Mini label="1ª consulta"><Input type="date" value={f.primeiraConsulta} onChange={upd("primeiraConsulta")} /></Mini>
      <Mini label="Data do parto"><Input type="date" value={f.dataParto} onChange={upd("dataParto")} /></Mini>
      <div className="md:col-span-3 flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}><X className="h-4 w-4 mr-1" />Cancelar</Button>
        <Button onClick={save}><Save className="h-4 w-4 mr-1" />Salvar</Button>
      </div>
    </div>
  );
}

function Mini({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function IndicatorRow({ def, g }: { def: IndicatorDef; g: Gestante }) {
  const { user } = useAuth();
  const status = indicatorStatus(g, def.key);
  const editable = !!user && canEditIndicator(user.role, def.key);
  const value = g.indicadores[def.key];

  const setVal = (v: Indicators[IndicatorKey]) => {
    if (!user || !editable) return;
    store.setIndicator(g.id, def.key, v, { user: user.username, role: user.role });
    toast.success(`Indicador ${def.key} atualizado.`);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 border rounded-lg p-3 bg-card">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center font-semibold ${statusColor(status)}`}>
          {def.key}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{def.short}</div>
          <p className="text-xs text-muted-foreground">{def.label}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Responsável: {roleLabel[def.owner]}</Badge>
            <Badge variant="outline" className={statusColor(status)}>{statusLabel(status)}</Badge>
          </div>
        </div>
      </div>
      <div className="md:w-auto">
        {def.type === "boolean" ? (
          <BoolControl value={value as boolean | null} editable={editable} onChange={setVal} />
        ) : (
          <CountControl value={(value as number) ?? 0} max={def.max ?? 7} editable={editable} onChange={setVal} />
        )}
        {!editable && (
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-1">
            <Lock className="h-3 w-3" />Somente leitura
          </div>
        )}
      </div>
    </div>
  );
}

function BoolControl({ value, editable, onChange }: { value: boolean | null; editable: boolean; onChange: (v: boolean | null) => void }) {
  const btn = (label: string, v: boolean, active: boolean) => (
    <Button
      type="button" size="sm"
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

function CountControl({ value, max, editable, onChange }: { value: number; max: number; editable: boolean; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {Array.from({ length: max + 1 }, (_, i) => i).map((n) => (
        <Button
          key={n}
          type="button" size="sm"
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

function statusLabel(s: string) {
  return s === "ok" ? "Em dia" : s === "warn" ? "Próximo do vencimento" : s === "late" ? "Vencido" : "Não aplicável";
}

const PATIENT_FIELD_LABELS: Record<string, string> = {
  nome: "Nome", cpf: "CPF", dataNascimento: "Data de nascimento", endereco: "Endereço",
  telefone: "Telefone", cartaoSus: "Cartão SUS", dum: "DUM", microarea: "Microárea / ACS",
  primeiraConsulta: "1ª consulta", dataParto: "Data do parto",
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
