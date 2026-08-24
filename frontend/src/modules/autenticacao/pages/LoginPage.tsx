import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getErrorMessage } from "../../../shared/http/getErrorMessage";
import { Alert } from "../../../shared/ui/PageHeader";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { IconEye, IconEyeOff, IconRefresh } from "../../../shared/ui/icons";
import { AutenticacaoRepository } from "../autenticacao.repository";
import { AutenticacaoService } from "../autenticacao.service";

export function LoginPage() {
  const { http, setSession, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const service = useMemo(() => new AutenticacaoService(new AutenticacaoRepository(http)), [http]);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 py-12">
      {/* Brilhos discretos da marca, só para o fundo não ficar chapado. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[26rem] rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--color-brand-green-soft)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -right-36 size-[24rem] rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--color-brand-red-soft)" }}
      />

      <div className="relative w-full max-w-[26rem]">
        <div className="mb-0 flex flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="Farmácia Bairro Saúde"
            className="h-50 w-auto object-contain"
          />
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-[28px] bg-surface p-8 shadow-card ring-1 ring-line animate-surgir"
        >
          {error ? <Alert onClose={() => setError(null)}>{error}</Alert> : null}

          <Input
            label="E-mail"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="voce@farmacia.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <Input
              label="Senha"
              type={mostrarSenha ? "text" : "password"}
              name="senha"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((atual) => !atual)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-xl text-ink-muted transition hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
            >
              {mostrarSenha ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? (
              <>
                <IconRefresh size={16} className="animate-spin" />
                Entrando...
              </>
            ) : (
              "Acessar painel"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
          Não tem acesso? Peça a um <strong className="font-semibold text-ink">gerente</strong> para
          cadastrar o seu usuário.
        </p>
      </div>
    </div>
  );
}
