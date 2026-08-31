import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import { ProtectedRoute } from "./shared/auth/ProtectedRoute";
import { RoleRoute } from "./shared/auth/RoleRoute";
import {
  PERFIS_AVALIAM_ITENS,
  PERFIS_CONTROLAM_VALIDADE,
  PERFIS_GERENCIAM_PRESCRICOES,
  PERFIS_LISTAM_VENDAS,
  PERFIS_REGISTRAR_VENDA_PDV,
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
import { PainelVendaPage } from "./modules/venda/pages/PainelVendaPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allow={PERFIS_REGISTRAR_VENDA_PDV} />}>
              <Route path="registrar-venda" element={<PainelVendaPage />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />

              <Route element={<RoleRoute allow={PERFIS_LISTAM_VENDAS} />}>
                <Route path="vendas" element={<VendasPage />} />
              </Route>
              <Route path="produtos" element={<ProdutosPage />} />
              {/* A aba aparece para todo mundo; só o gerente vê as ações de cadastro. */}
              <Route path="usuarios" element={<UsuariosPage />} />
              <Route path="produtos/entrada" element={<Navigate to="/produtos" replace />} />

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
