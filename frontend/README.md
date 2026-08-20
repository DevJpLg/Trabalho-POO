# Frontend — Farmácia Bairro Saúde

React + Tailwind CSS + Vite, isolado do backend (não altera arquivos existentes da API).

## Como rodar

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`. A API deve estar em `http://localhost:3333` (proxy `/api`).

### API + frontend juntos

```bash
cd frontend
npm run dev:all
```

Sobe o backend (`npm run dev` na raiz) e o Vite em paralelo via `concurrently`.

## Arquitetura

Cada módulo segue: **repository (HTTP) → service → pages**, espelhando a ordem do backend.

Módulos: `autenticacao`, `usuario`, `produto`, `itemVenda`, `prescricao`.

Ver [ERROS_BACKEND.md](./ERROS_BACKEND.md) para limitações da API.
