import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { perfilLabel, type Perfil } from "../types/api";
import { BrandLogo } from "./BrandLogo";
import { IconButton } from "./Button";
import { podeAvaliarItens, podeRegistrarVendaPdv } from "../auth/permissoes";
import { filhosVisiveis, navItems, pageTitles, perfilPode, type NavItem } from "./nav";
import { PageTitleContext } from "./usePageTitle";
import {
  IconChevronDown,
  IconClose,
  IconLogout,
  IconMenu,
  IconRegister,
  IconSearch,
  IconUser,
} from "./icons";
import { NotificacaoBell } from "../../modules/notificacao/NotificacaoBell";

const iniciais = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

function UserMenu() {
  const { logout, usuario } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white shadow-card transition-all duration-150 hover:bg-brand-green-dark active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
        aria-label="Menu do usuário"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        {usuario ? iniciais(usuario.nome) : <IconUser size={18} />}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl bg-surface p-1.5 shadow-pop ring-1 ring-line animate-surgir"
        >
          {usuario ? (
            <div className="border-b border-line px-3 py-3">
              <p className="truncate text-sm font-semibold text-ink">{usuario.nome}</p>
              <p className="truncate text-xs text-ink-muted">{usuario.email}</p>
              <p className="mt-1.5 inline-flex rounded-full bg-brand-green-soft px-2 py-0.5 text-[11px] font-semibold text-brand-green">
                {perfilLabel[usuario.perfil]}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-brand-red-soft hover:text-brand-red"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <IconLogout size={16} />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SidebarGroup({
  item,
  perfil,
  onNavigate,
}: {
  item: NavItem;
  perfil: Perfil;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const children = filhosVisiveis(item, perfil);
  const childActive = children.some((child) => location.pathname === child.to);
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const base =
    "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35";
  const ativo = "bg-brand-green-soft text-brand-green shadow-sm";
  const inativo = "text-ink-muted hover:bg-surface-hover hover:text-ink";

  // Um grupo que sobrou com um filho só não é menu nenhum: vira link direto,
  // como acontece com "Produtos" para quem apenas consulta o catálogo.
  const destino = item.to ?? (children.length === 1 ? children[0].to : undefined);

  if (destino) {
    return (
      <NavLink
        to={destino}
        end={item.end ?? (item.to ? undefined : true)}
        onClick={onNavigate}
        className={({ isActive }) => `${base} ${isActive ? ativo : inativo}`}
      >
        {({ isActive }) => (
          <>
            <item.icon
              size={19}
              className={`shrink-0 ${isActive ? "text-brand-green" : "text-ink-muted group-hover:text-ink"}`}
            />
            <span className="truncate">{item.label}</span>
          </>
        )}
      </NavLink>
    );
  }

  if (children.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${base} text-left ${childActive ? ativo : inativo}`}
      >
        <item.icon
          size={19}
          className={`shrink-0 ${childActive ? "text-brand-green" : "text-ink-muted group-hover:text-ink"}`}
        />
        <span className="flex-1 truncate">{item.label}</span>
        <IconChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="mb-1 ml-6 mt-1 flex flex-col gap-0.5 border-l border-line pl-3">
          {children.map((child) => (
            <NavLink
              key={`${child.to}-${child.label}`}
              to={child.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-[13px] font-medium leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35 ${
                  isActive
                    ? "bg-brand-green-soft/70 text-brand-green"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { logout, usuario } = useAuth();
  const items = navItems.filter((item) => perfilPode(usuario?.perfil, item.roles));

  return (
    <div className="flex h-full flex-col gap-1 px-4 py-5">
      <div className="px-1 pb-3">
        <BrandLogo compact />
      </div>

      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-muted/70">
        Menu
      </p>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pb-2" aria-label="Principal">
        {usuario
          ? items.map((item) => (
              <SidebarGroup
                key={item.id}
                item={item}
                perfil={usuario.perfil}
                onNavigate={onNavigate}
              />
            ))
          : null}
      </nav>

      {podeRegistrarVendaPdv(usuario?.perfil) ? (
        <NavLink
          to="/registrar-venda"
          onClick={onNavigate}
          className="mb-1 mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-red px-3 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-brand-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50"
        >
          <IconRegister size={19} className="shrink-0" />
          Registrar venda
        </NavLink>
      ) : null}

      {usuario ? (
        <div className="mt-auto shrink-0 border-t border-line pt-3">
          <div className="flex items-center gap-3 rounded-2xl bg-surface-muted px-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-green text-white">
              {iniciais(usuario.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{usuario.nome}</p>
              <p className="truncate text-xs text-ink-muted">{perfilLabel[usuario.perfil]}</p>
            </div>
            <IconButton label="Sair" tone="danger" onClick={logout}>
              <IconLogout size={17} />
            </IconButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [title, setTitle] = useState(pageTitles[location.pathname] ?? "Painel");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const setPageTitle = useCallback((next: string) => setTitle(next), []);
  const titleValue = useMemo(() => setPageTitle, [setPageTitle]);

  // Fecha o menu lateral ao trocar de rota no celular.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
  }

  return (
    <PageTitleContext.Provider value={titleValue}>
      <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="fixed inset-y-0 left-0 z-20 hidden h-full w-[264px] flex-col border-r border-line bg-surface lg:flex">
          <SidebarNav />
        </aside>
        <div className="hidden lg:block" aria-hidden />

        {menuOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="relative z-10 h-full w-[272px] bg-surface shadow-pop animate-surgir">
              <button
                type="button"
                className="absolute right-3 top-4 z-20 rounded-xl p-2 text-ink-muted transition hover:bg-surface-hover hover:text-ink"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar"
              >
                <IconClose />
              </button>
              <SidebarNav onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between gap-4 border-b border-line/70 bg-canvas/85 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-xl bg-surface p-2.5 text-ink shadow-card ring-1 ring-line transition hover:bg-surface-hover lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <IconMenu />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[21px] font-bold tracking-tight text-ink sm:text-[26px]">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
              {usuario ? (
                <form onSubmit={onSearch} className="hidden min-w-0 md:block">
                  <label className="relative block">
                    <span className="sr-only">Buscar produtos</span>
                    <IconSearch
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar produto..."
                      className="h-11 w-56 max-w-full rounded-full bg-surface pl-11 pr-4 text-sm text-ink shadow-card outline-none ring-1 ring-line transition-all placeholder:text-ink-muted/80 hover:ring-ink-muted/35 focus:ring-2 focus:ring-brand-green/45 lg:w-72"
                    />
                  </label>
                </form>
              ) : null}

              {podeAvaliarItens(usuario?.perfil) ? <NotificacaoBell /> : null}
              <UserMenu />
            </div>
          </header>

          <main className="min-w-0 flex-1 px-5 pb-12 pt-6 sm:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  );
}
