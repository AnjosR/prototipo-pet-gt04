import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatIG, calcDPP, formatDate } from "@/lib/gestacao";

export const Route = createFileRoute("/gestante/nova")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <NovaGestante />
      </AppShell>
    </RequireAuth>
  ),
});

function NovaGestante() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== "medico") {
      toast.error("Apenas Médico/Enfermeiro pode cadastrar gestantes.");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, navigate]);

  const [form, setForm] = useState({
    nome: "", cpf: "", dataNascimento: "", endereco: "", telefone: "",
    cartaoSus: "", dum: "", microarea: "", primeiraConsulta: "", dataParto: "",
  });
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.dum) { toast.error("Nome e DUM são obrigatórios."); return; }
    if (!user) return;
    const g = store.create({ ...form, createdBy: user.username });
    toast.success("Gestante cadastrada.");
    navigate({ to: "/gestante/$id", params: { id: g.id } });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Nova gestante</h1>
      <p className="text-sm text-muted-foreground mb-4">Preencha os dados básicos. Os indicadores serão registrados depois.</p>
      <Card>
        <CardHeader><CardTitle>Dados da gestante</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome completo *" className="md:col-span-2"><Input value={form.nome} onChange={upd("nome")} required /></Field>
            <Field label="CPF"><Input value={form.cpf} onChange={upd("cpf")} placeholder="000.000.000-00" /></Field>
            <Field label="Data de nascimento"><Input type="date" value={form.dataNascimento} onChange={upd("dataNascimento")} /></Field>
            <Field label="Endereço" className="md:col-span-2"><Input value={form.endereco} onChange={upd("endereco")} /></Field>
            <Field label="Telefone"><Input value={form.telefone} onChange={upd("telefone")} placeholder="(86) 9..." /></Field>
            <Field label="Cartão SUS"><Input value={form.cartaoSus} onChange={upd("cartaoSus")} /></Field>
            <Field label="DUM (Data Última Menstruação) *"><Input type="date" value={form.dum} onChange={upd("dum")} required /></Field>
            <Field label="Microárea / ACS responsável"><Input value={form.microarea} onChange={upd("microarea")} placeholder="Microárea 03 — ACS Joana" /></Field>
            <Field label="Data da 1ª consulta"><Input type="date" value={form.primeiraConsulta} onChange={upd("primeiraConsulta")} /></Field>
            <Field label="Data do parto"><Input type="date" value={form.dataParto} onChange={upd("dataParto")} /></Field>

            {form.dum && (
              <div className="md:col-span-2 rounded-md bg-accent/40 p-3 text-sm">
                IG atual: <strong>{formatIG(form.dum)}</strong> · DPP: <strong>{formatDate(calcDPP(form.dum) ?? undefined)}</strong>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancelar</Button>
              <Button type="submit">Cadastrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
