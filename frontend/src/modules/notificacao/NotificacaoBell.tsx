import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { getErrorMessage } from "../../shared/http/getErrorMessage";
import type { NotificacaoDTO } from "../../shared/types/api";
import { dataHora } from "../../shared/ui/format";
import { IconBell } from "../../shared/ui/icons";
import { NotificacaoRepository } from "./notificacao.repository";
import { NotificacaoService } from "./notificacao.service";

const INTERVALO_ATUALIZACAO_MS = 20_000;

export function NotificacaoBell() {
  const { http } = useAuth();
  const navigate = useNavigate();
  const service = useMemo(() => new NotificacaoService(new NotificacaoRepository(http)), [http]);

  const [aberta, setAberta] = useState(false);
  const [notificacoes, setNotificacoes] = useState<NotificacaoDTO[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setNotificacoes(await service.listar());
    } catch (err) {
      setErro(getErrorMessage(err));
    }
  }, [service]);

  useEffect(() => {
    void carregar();
    const timer = window.setInterval(() => {
      void carregar();
    }, INTERVALO_ATUALIZACAO_MS);
    return () => window.clearInterval(timer);
  }, [carregar]);

  useEffect(() => {
    if (!aberta) return;

    void carregar();

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setAberta(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAberta(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [aberta, carregar]);

  async function aoAbrirSino() {
    const vaiAbrir = !aberta;
    setAberta(vaiAbrir);
    if (vaiAbrir) {
      setCarregando(true);
      await carregar();
      setCarregando(false);
    }
  }

  function aoClicarNotificacao(notificacao: NotificacaoDTO) {
    setAberta(false);
    navigate(`/avaliacoes?venda=${notificacao.vendaId}`);
  }

  const quantidade = notificacoes.length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`relative flex size-11 items-center justify-center rounded-full shadow-card ring-1 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${
          quantidade > 0
            ? "bg-brand-red text-white ring-brand-red/50 hover:bg-brand-red-dark"
            : "bg-surface text-ink-muted ring-line hover:bg-surface-hover hover:text-ink"
        }`}
        aria-label="Notificações"
        aria-expanded={aberta}
        aria-haspopup="dialog"
        onClick={() => void aoAbrirSino()}
      >
        <IconBell size={18} />
        {quantidade > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-pulsar items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-brand-red ring-2 ring-brand-red">
            {quantidade > 9 ? "9+" : quantidade}
          </span>
        ) : null}
      </button>

      {aberta ? (
        <div
          role="dialog"
          aria-label="Notificações não atendidas"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-surface shadow-pop ring-1 ring-line animate-surgir sm:w-96"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notificações</p>
            <p className="text-xs text-ink-muted">
              {quantidade === 0
                ? "Nenhuma venda aguardando avaliação."
                : `${quantidade} venda${quantidade === 1 ? "" : "s"} aguardando avaliação.`}
            </p>
          </div>

          {erro ? <p className="px-4 py-2 text-xs text-brand-red">{erro}</p> : null}

          <div className="max-h-80 overflow-y-auto p-1.5">
            {carregando && quantidade === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-muted">Carregando...</p>
            ) : quantidade === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-muted">Nada pendente no momento.</p>
            ) : (
              <ul>
                {notificacoes.map((notificacao) => (
                  <li key={notificacao.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-brand-green-soft"
                      onClick={() => void aoClicarNotificacao(notificacao)}
                    >
                      <span className="text-sm font-semibold text-ink">
                        Venda #{notificacao.vendaId} aguardando avaliação
                      </span>
                      <span className="text-xs text-ink-muted">{dataHora(notificacao.dataHora)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
