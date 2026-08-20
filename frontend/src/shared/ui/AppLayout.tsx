import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Perfil } from "../types/api";
import { BrandLogo } from "./BrandLogo";
import { filhosVisiveis, navItems, pageTitles, perfilPode, type NavItem } from "./nav";
import { PageTitleContext } from "./usePageTitle";
import { IconBell, IconClose, IconLogout, IconMenu, IconSearch } from "./icons";
import { Button } from "./Button";

const perfilLabel: Record<Perfil, string> = {
  GERENTE: "Gerente",
  ATENDENTE: "Atendente",
  FARMACEUTICO: "Farmacêutico",
  CAIXA: "Caixa",
};

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
        className="flex size-12 items-center justify-center rounded-full bg-white text-ink-muted shadow-[0_8px_20px_rgba(26,46,37,0.06)] transition hover:text-ink"
        aria-label="Menu do usuário"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <i className="fa-solid fa-user text-[18px]" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_rgba(26,46,37,0.12)]"
        >
          {usuario ? (
            <div className="border-b border-line px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-ink">{usuario.nome}</p>
              <p className="mt-0.5 text-xs font-medium text-ink-muted">{perfilLabel[usuario.perfil]}</p>
            </div>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-brand-red-soft hover:text-brand-red"
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

  if (item.to) {
    return (
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition ${
            isActive ? "text-brand-green" : "text-ink-muted hover:bg-canvas hover:text-ink"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive ? (
              <span className="absolute -left-5 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-brand-green" />
            ) : null}
            <i
              className={`fa-solid ${item.icon} w-5 text-center text-[15px] ${isActive ? "text-brand-green" : "text-ink-muted"}`}
              aria-hidden="true"
            />
            {item.label}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium transition ${
          childActive ? "text-brand-green" : "text-ink-muted hover:bg-canvas hover:text-ink"
        }`}
      >
        {childActive ? (
          <span className="absolute -left-5 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-brand-green" />
        ) : null}
        <i
          className={`fa-solid ${item.icon} w-5 text-center text-[15px] ${childActive ? "text-brand-green" : "text-ink-muted"}`}
          aria-hidden="true"
        />
        <span className="flex-1">{item.label}</span>
        <i
          className={`fa-solid fa-chevron-down text-[11px] transition ${open ? "rotate-180" : ""} ${
            childActive ? "text-brand-green" : "text-ink-muted"
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="mb-1 ml-8 mt-0.5 flex flex-col gap-0.5 border-l border-line pl-3">
          {children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `rounded-lg px-2 py-2 text-[13px] font-medium leading-snug transition ${
                  isActive ? "text-brand-green" : "text-ink-muted hover:bg-canvas hover:text-ink"
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
    <div className="flex h-full flex-col px-5 py-2">
      <BrandLogo compact className="mb-1 ml-1" />

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Principal">
        {usuario
          ? items.map((item) => (
              <SidebarGroup key={item.id} item={item} perfil={usuario.perfil} onNavigate={onNavigate} />
            ))
          : null}
      </nav>

      {usuario ? (
        <div className="mt-6 rounded-xl bg-canvas px-3 py-3">
          <p className="truncate text-sm font-semibold text-ink">{usuario.nome}</p>
          <p className="mt-0.5 text-xs font-medium text-ink-muted">{perfilLabel[usuario.perfil]}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={logout}
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink-muted transition hover:bg-brand-red-soft hover:text-brand-red"
      >
        <IconLogout size={20} />
        Sair
      </button>
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
  const perfil = usuario?.perfil;
  const showSearch = perfilPode(perfil, ["GERENTE", "FARMACEUTICO"]);
  const showNovaVenda = perfilPode(perfil, ["ATENDENTE", "CAIXA"]);
  const showNotificacoes = perfilPode(perfil, ["FARMACEUTICO"]);

  const setPageTitle = useCallback((next: string) => setTitle(next), []);
  const titleValue = useMemo(() => setPageTitle, [setPageTitle]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
    setMenuOpen(false);
  }

  return (
    <PageTitleContext.Provider value={titleValue}>
      <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[250px_1fr]">
        <aside className="hidden bg-white lg:block">
          <SidebarNav />
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/30"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="relative z-10 h-full w-[250px] bg-white shadow-xl">
              <button
                type="button"
                className="absolute right-3 top-4 rounded-full p-2 text-ink-muted"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar"
              >
                <IconClose />
              </button>
              <SidebarNav onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between gap-4 px-5 py-6 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-full bg-white p-2.5 text-ink shadow-[0_8px_20px_rgba(26,46,37,0.06)] lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <IconMenu />
              </button>
              <h1 className="truncate text-[22px] font-semibold tracking-tight text-ink sm:text-[28px]">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {showSearch ? (
                <form onSubmit={onSearch} className="hidden md:block">
                  <label className="relative block">
                    <span className="sr-only">Buscar produtos</span>
                    <IconSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar produto..."
                      className="h-12 w-56 rounded-full bg-white pl-11 pr-4 text-sm text-ink shadow-[0_8px_20px_rgba(26,46,37,0.04)] outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand-green/25 lg:w-72"
                    />
                  </label>
                </form>
              ) : null}

              {showNovaVenda ? (
                <Button
                  type="button"
                  onClick={() =>
                    navigate(perfil === "CAIXA" ? "/caixa/novo" : "/atendimento/novo")
                  }
                >
                  Nova venda
                </Button>
              ) : null}

              {showNotificacoes ? (
                <button
                  type="button"
                  className="relative flex size-12 items-center justify-center rounded-full bg-white text-ink-muted shadow-[0_8px_20px_rgba(26,46,37,0.06)]"
                  aria-label="Notificações"
                >
                  <IconBell />
                  <span className="absolute right-3 top-3 size-2 rounded-full bg-brand-red" />
                </button>
              ) : null}
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 px-5 pb-10 sm:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  );
}
