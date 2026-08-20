import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import { BrandLogo } from "../../../shared/ui/BrandLogo";
import { Alert } from "../../../shared/ui/PageHeader";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { AutenticacaoRepository } from "../autenticacao.repository";
import { AutenticacaoService } from "../autenticacao.service";

export function LoginPage() {
  const { http, setSession, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const service = useMemo(() => new AutenticacaoService(new AutenticacaoRepository(http)), [http]);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, usuario } = await service.login(email, senha);
      setSession(token, usuario);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Falha ao autenticar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-brand-red/10" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 size-96 rounded-full bg-brand-green/10" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <BrandLogo className="max-w-[360px]" />
          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-muted">
            Painel operacional da farmácia: estoque, itens de venda e prescrições em um layout limpo
            e rápido.
          </p>
          <div className="mt-10 flex gap-3">
            <span className="rounded-full bg-brand-green-soft px-4 py-2 text-sm font-semibold text-brand-green">
              Saúde
            </span>
            <span className="rounded-full bg-brand-red-soft px-4 py-2 text-sm font-semibold text-brand-red">
              Cuidado
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo className="max-w-[240px]" />
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-[28px] bg-white p-8 shadow-[0_20px_60px_rgba(26,46,37,0.08)]"
          >
            <div>
              <h1 className="text-2xl font-semibold text-ink">Entrar</h1>
              <p className="mt-1 text-sm text-ink-muted">Use seu e-mail e senha cadastrados.</p>
            </div>

            {error ? <Alert>{error}</Alert> : null}

            <Input
              label="E-mail"
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Senha"
              type="password"
              name="senha"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Acessar painel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
