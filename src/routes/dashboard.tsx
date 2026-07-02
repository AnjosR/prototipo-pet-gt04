import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { useGestantes } from "@/lib/store";
import { formatIG, formatDate, calcDPP } from "@/lib/gestacao";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

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

  const microareas = useMemo(
    () => Array.from(new Set(all.map((g) => g.microarea).filter(Boolean))).sort(),
    [all],
  );

  const filtered = useMemo(() => {
    return all.filter((g) => {
      if (q && !`${g.nome} ${g.id}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (micro !== "all" && g.microarea !== micro) return false;
      return true;
    });
  }, [all, q, micro]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Painel de Gestantes</h1>
          <p className="text-sm text-muted-foreground">
            {all.length} gestante(s) acompanhada(s) · Perfil:{" "}
            <span className="font-medium">{user?.displayName}</span>
          </p>
        </div>
        {user?.role === "medico" && (
          <Button asChild>
            <Link to="/gestante/nova">
              <Plus className="h-4 w-4 mr-1" />
              Nova gestante
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-55">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome ou código..."
                className="pl-9"
              />
            </div>
            <Select value={micro} onValueChange={setMicro}>
              <SelectTrigger className="w-55">
                <SelectValue placeholder="Microárea" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as microáreas</SelectItem>
                {microareas.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-2">
                      <Link
                        to="/gestante/$id"
                        params={{ id: g.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {g.nome}
                      </Link>
                      <div className="text-xs text-muted-foreground">{g.id}</div>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <div>{formatIG(g.dum)}</div>
                      <div className="text-xs text-muted-foreground">
                        DPP: {formatDate(calcDPP(g.dum) ?? undefined)}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-xs">{g.microarea || "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-muted-foreground">
                      Nenhuma gestante encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
