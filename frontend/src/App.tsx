import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import { ProtectedRoute } from "./shared/auth/ProtectedRoute";
import { RoleRoute } from "./shared/auth/RoleRoute";
import {
  PERFIS_AVALIAM_ITENS,
  PERFIS_CONTROLAM_VALIDADE,
  PERFIS_GERENCIAM_PRESCRICOES,
  PERFIS_GERENCIAM_PRODUTOS,
} from "./shared/auth/permissoes";
import { AppLayout } from "./shared/ui/AppLayout";
import { LoginPage } from "./modules/autenticacao/pages/LoginPage";
import { DashboardPage } from "./modules/autenticacao/pages/DashboardPage";
import { UsuariosPage } from "./modules/usuario/pages/UsuariosPage";
import { ProdutosPage } from "./modules/produto/pages/ProdutosPage";
import { ItensVendaPage } from "./modules/itemVenda/pages/ItensVendaPage";
import { PrescricoesPage } from "./modules/prescricao/pages/PrescricoesPage";
import { VendasPage } from "./modules/venda/pages/VendasPage";
import { AvaliacoesPage } from "./modules/venda/pages/AvaliacoesPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />

              {/* Rotas liberadas para qualquer usuário autenticado pelo backend. */}
              <Route path="vendas" element={<VendasPage />} />
              <Route path="produtos" element={<ProdutosPage />} />
              {/* A aba aparece para todo mundo; só o gerente vê as ações de cadastro. */}
              <Route path="usuarios" element={<UsuariosPage />} />

              <Route element={<RoleRoute allow={PERFIS_GERENCIAM_PRODUTOS} />}>
                <Route path="produtos/entrada" element={<ProdutosPage />} />
              </Route>

              <Route element={<RoleRoute allow={PERFIS_CONTROLAM_VALIDADE} />}>
                <Route path="produtos/validades" element={<ProdutosPage />} />
              </Route>

              <Route
                element={<RoleRoute allow={PERFIS_GERENCIAM_PRESCRICOES} />}
              >
                <Route path="prescricoes" element={<PrescricoesPage />} />
              </Route>

              <Route element={<RoleRoute allow={PERFIS_AVALIAM_ITENS} />}>
                <Route path="avaliacoes" element={<AvaliacoesPage />} />
              </Route>

              <Route element={<RoleRoute allow={["ATENDENTE"]} />}>
                <Route path="atendimento" element={<ItensVendaPage />} />
              </Route>

              <Route element={<RoleRoute allow={["CAIXA"]} />}>
                <Route path="caixa" element={<ItensVendaPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
