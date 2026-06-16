import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "./types";

const USERS: User[] = [
  { username: "dentista01", password: "dentista_senha", role: "dentista", displayName: "Dr(a). Dentista" },
  { username: "medico01", password: "medico_senha", role: "medico", displayName: "Dr(a). Médico/Enfermeiro" },
  { username: "acs", password: "acs_senha", role: "acs", displayName: "Agente Comunitário de Saúde" },
];

interface AuthCtx {
  user: Omit<User, "password"> | null;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "ubs.session.v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = (username: string, password: string) => {
    const found = USERS.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
    );
    if (!found) return { ok: false, error: "Usuário ou senha inválidos" };
    const safe = { username: found.username, role: found.role, displayName: found.displayName };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    setUser(safe as Omit<User, "password">);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const roleLabel: Record<Role, string> = {
  medico: "Médico / Enfermeiro",
  acs: "Agente Comunitário",
  dentista: "Dentista",
};
