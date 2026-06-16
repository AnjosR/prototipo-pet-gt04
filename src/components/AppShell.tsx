import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, roleLabel } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Activity, LogOut } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
            <Activity className="h-5 w-5" />
            <span>UBS Parnaíba · Gestantes</span>
          </Link>
          <nav className="ml-4 hidden sm:flex gap-1 text-sm">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-md transition-colors ${pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
            >
              Painel
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden sm:block leading-tight">
              <div className="text-sm font-medium">{user.displayName}</div>
              <div className="text-xs text-muted-foreground">{roleLabel[user.role]} · @{user.username}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate({ to: "/login" }); }}>
              <LogOut className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
