import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Baby, User, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Protótipo GT04 - Acompanhamento de gestantes" },
      {
        name: "description",
        content: "Acesso ao sistema de acompanhamento de gestantes da UBS de Parnaíba.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = login(username, password);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Erro ao entrar");
      return;
    }
    toast.success("Bem-vindo(a)!");
    navigate({ to: "/dashboard", replace: true });
  };

  const quick = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold">Login de Usuário</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento de gestantes</p>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Use as credenciais fornecidas pela UBS.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="u">Usuário</Label>
                <Input
                  id="u"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex.: medico01"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p">Senha</Label>
                <Input
                  id="p"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-2">Acesso rápido (demonstração):</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quick("medico01", "medico_senha")}
                >
                  Enfermeiro / Médico
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quick("acs", "acs_senha")}
                >
                  ACS
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quick("dentista01", "dentista_senha")}
                >
                  Dentista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Dados fictícios, apenas para MVP.
        </p>
      </div>
    </div>
  );
}
