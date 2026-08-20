import { Navigate, Outlet } from "react-router-dom";
import type { Perfil } from "../types/api";
import { useAuth } from "./AuthContext";

export function RoleRoute({ allow }: { allow: Perfil[] }) {
  const { usuario } = useAuth();
  if (!usuario || !allow.includes(usuario.perfil)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
