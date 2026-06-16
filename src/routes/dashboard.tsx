import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { useGestantes } from "@/lib/store";
import { INDICATORS, indicatorStatus, statusColor } from "@/lib/indicators";
import { formatIG, formatDate, calcDPP } from "@/lib/gestacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <Dashboard />
      </AppShell>
    </RequireAuth>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const all = useGestantes();
  const [q, setQ] = useState("");
  const [micro, setMicro] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const microareas = useMemo(
    () => Array.from(new Set(all.map((g) => g.microarea).filter(Boolean))).sort(),
    [all],
  );

  const filtered = useMemo(() => {
    return all.filter((g) => {
      if (q && !(`${g.nome} ${g.cpf} ${g.cartaoSus}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (micro !== "all" && g.microarea !== micro) return false;
      if (statusFilter !== "all") {
        const hasMatching = INDICATORS.some((i) => indicatorStatus(g, i.key) === statusFilter);
        if (!hasMatching) return false;
      }
      return true;
    });
  }, [all, q, micro, statusFilter]);

  const totals = useMemo(() => {
    let ok = 0, warn = 0, late = 0;
    all.forEach((g) => INDICATORS.forEach((i) => {
      const s = indicatorStatus(g, i.key);
      if (s === "ok") ok++;
      else if (s === "warn") warn++;
      else if (s === "late") late++;
    }));
    return { ok, warn, late, total: all.length };
  }, [all]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Painel de Gestantes</h1>
          <p className="text-sm text-muted-foreground">
            {totals.total} gestante(s) acompanhada(s) · Perfil: <span className="font-medium">{user?.displayName}</span>
          </p>
        </div>
        {user?.role === "medico" && (
          <Button asChild>
            <Link to="/gestante/nova"><Plus className="h-4 w-4 mr-1" />Nova gestante</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Indicadores em dia" value={totals.ok} color="text-status-ok" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Próximos do vencimento" value={totals.warn} color="text-status-warn" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Indicadores vencidos" value={totals.late} color="text-status-late" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Gestantes cadastradas" value={totals.total} color="text-primary" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, CPF, Cartão SUS..." className="pl-9" />
            </div>
            <Select value={micro} onValueChange={setMicro}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Microárea" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as microáreas</SelectItem>
                {microareas.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ok">Em dia</SelectItem>
                <SelectItem value="warn">Próximo do vencimento</SelectItem>
                <SelectItem value="late">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 px-2 font-medium">Gestante</th>
                  <th className="py-2 px-2 font-medium">IG / DPP</th>
                  <th className="py-2 px-2 font-medium">Microárea</th>
                  {INDICATORS.map((i) => (
                    <th key={i.key} className="py-2 px-1 text-center font-medium" title={i.label}>{i.key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-2">
                      <Link to="/gestante/$id" params={{ id: g.id }} className="font-medium text-primary hover:underline">
                        {g.nome}
                      </Link>
                      <div className="text-xs text-muted-foreground">{g.cpf}</div>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <div>{formatIG(g.dum)}</div>
                      <div className="text-xs text-muted-foreground">DPP: {formatDate(calcDPP(g.dum) ?? undefined)}</div>
                    </td>
                    <td className="py-2 px-2 text-xs">{g.microarea || "—"}</td>
                    {INDICATORS.map((i) => {
                      const s = indicatorStatus(g, i.key);
                      return (
                        <td key={i.key} className="py-2 px-1 text-center">
                          <Link to="/gestante/$id" params={{ id: g.id }}>
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold ${statusColor(s)}`}
                              title={`${i.short} — ${statusLabel(s)}`}
                            >
                              {i.key}
                            </span>
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={3 + INDICATORS.length} className="py-10 text-center text-muted-foreground">Nenhuma gestante encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <LegendDot className="bg-status-ok" label="Em dia" />
            <LegendDot className="bg-status-warn" label="Próximo do vencimento" />
            <LegendDot className="bg-status-late" label="Vencido" />
            <LegendDot className="bg-muted" label="Ainda não aplicável" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded ${className}`} />
      {label}
    </span>
  );
}

function statusLabel(s: string) {
  return s === "ok" ? "Em dia" : s === "warn" ? "Próximo do vencimento" : s === "late" ? "Vencido" : "Não aplicável";
}
