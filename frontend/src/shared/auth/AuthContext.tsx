import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import { HttpClient, type InterfaceHttpClient } from "../http/HttpClient";
import type { Perfil, UsuarioDTO } from "../types/api";

const TOKEN_KEY = "fbs_token";
const USUARIO_KEY = "fbs_usuario";

const PERFIS: Perfil[] = ["GERENTE", "ATENDENTE", "FARMACEUTICO", "CAIXA"];

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  usuario: UsuarioDTO | null;
  http: InterfaceHttpClient;
  setSession: (token: string, usuario: UsuarioDTO) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function isUsuarioDTO(value: unknown): value is UsuarioDTO {
  if (!value || typeof value !== "object") return false;
  const u = value as Record<string, unknown>;
  return (
    typeof u.id === "number" &&
    typeof u.nome === "string" &&
    typeof u.email === "string" &&
    typeof u.perfil === "string" &&
    PERFIS.includes(u.perfil as Perfil)
  );
}

function readStoredUsuario(): UsuarioDTO | null {
  try {
    const raw = localStorage.getItem(USUARIO_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isUsuarioDTO(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => readStoredToken());
  const [usuario, setUsuarioState] = useState<UsuarioDTO | null>(() => readStoredUsuario());

  const setSession = useCallback((nextToken: string, nextUsuario: UsuarioDTO) => {
    setTokenState(nextToken);
    setUsuarioState(nextUsuario);
    try {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USUARIO_KEY, JSON.stringify(nextUsuario));
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const logout = useCallback(() => {
    setTokenState(null);
    setUsuarioState(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const http = useMemo(
    () =>
      new HttpClient(import.meta.env.VITE_API_BASE_URL ?? "/api", () =>
        localStorage.getItem(TOKEN_KEY),
      ),
    [],
  );

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      usuario,
      http,
      setSession,
      logout,
    }),
    [token, usuario, http, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
