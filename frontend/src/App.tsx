import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import { ProtectedRoute } from "./shared/auth/ProtectedRoute";
import { RoleRoute } from "./shared/auth/RoleRoute";
import { AppLayout } from "./shared/ui/AppLayout";
import { LoginPage } from "./modules/autenticacao/pages/LoginPage";
import { DashboardPage } from "./modules/autenticacao/pages/DashboardPage";
import { UsuariosPage } from "./modules/usuario/pages/UsuariosPage";
import { ProdutosPage } from "./modules/produto/pages/ProdutosPage";
import { ItensVendaPage } from "./modules/itemVenda/pages/ItensVendaPage";
import { PrescricoesPage } from "./modules/prescricao/pages/PrescricoesPage";
import { VendasPage } from "./modules/venda/pages/VendasPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="vendas" element={<VendasPage />} />

              <Route element={<RoleRoute allow={["CAIXA"]} />}>
                <Route path="caixa/novo" element={<ItensVendaPage />} />
                <Route path="caixa/historico" element={<ItensVendaPage />} />
              </Route>

              <Route element={<RoleRoute allow={["ATENDENTE"]} />}>
                <Route path="atendimento/novo" element={<ItensVendaPage />} />
                <Route path="atendimento/historico" element={<ItensVendaPage />} />
              </Route>

              <Route element={<RoleRoute allow={["FARMACEUTICO"]} />}>
                <Route path="avaliacoes/pendentes" element={<ItensVendaPage />} />
                <Route path="avaliacoes/historico" element={<ItensVendaPage />} />
                <Route path="produtos/validades" element={<ProdutosPage />} />
                <Route path="prescricoes/pendentes" element={<PrescricoesPage />} />
                <Route path="prescricoes/historico" element={<PrescricoesPage />} />
              </Route>

              <Route element={<RoleRoute allow={["GERENTE"]} />}>
                <Route path="produtos/entrada" element={<ProdutosPage />} />
                <Route path="usuarios" element={<UsuariosPage />} />
                <Route path="usuarios/novo" element={<UsuariosPage />} />
              </Route>

              <Route element={<RoleRoute allow={["GERENTE", "FARMACEUTICO"]} />}>
                <Route path="produtos" element={<ProdutosPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
