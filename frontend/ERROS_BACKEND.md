# Erros e limitações do backend (não corrigidos pelo frontend)

Este documento lista problemas identificados no backend **sem modificar arquivos existentes**, conforme a regra do projeto. O frontend consome apenas as rotas já implementadas e trata falhas via mensagem da API.

## Bloqueadores de boot (API pode não subir)

1. **`src/shared/routes/index.ts`** importa `criarVendaRoutes` e `criarNotificacaoRoutes`, mas:
   - `src/modules/venda/venda.routes.ts` exporta apenas `vendaRoutes` (stub comentado).
   - `src/modules/notificacao/notificacao.routes.ts` exporta apenas `notificacaoRoutes` (stub comentado).

2. **`src/shared/middleware/index.ts`** faz `export { authGuard } from "./authGuard"`, porém `authGuard.ts` só tem `export default class AuthGuard`. A instância correta é criada no container (`authGuard`), mas o named export do middleware não existe.

3. **DI incompleto / inconsistente**
   - `ItemVendaController` exige `validacaoItemService` no construtor; o container instancia só com `itemVendaService`.
   - Módulo prescrição: classe tipada/nomeada como `PerscricaoService`; possíveis dependências de venda ausentes no container.

## Contratos frágeis (UI preparada, mas comportamento pode falhar)

| Problema | Impacto no front |
|----------|------------------|
| `PATCH /api/produtos/:id/entrada` sem JSON de sucesso no happy path | Front exibe fallback “Entrada registrada.” |
| `GET /api/prescricoes/numero/:numeroPrescricao` registrado **depois** de `GET /:id` + `[]` solto na linha da rota | Front **não** usa essa rota |
| Controllers de prescrição retornam instâncias de classe | Campos podem vir vazios/`{}` se a serialização falhar; UI tolera campos ausentes |
| Sem CORS no Express (`src/app.ts`) | Mitigado pelo proxy Vite (`/api` → `localhost:3333`) |
| JWT contém só `{ id }` | Menu mostra todos os módulos; autorização fica no backend |
| Rotas `/api/vendas` e `/api/notificacoes` não implementadas | Sem telas correspondentes no front |
| Itens de venda exigem `vendaId` sem API para criar venda | Tela pede ID manual (seed 1–5) |

## Escopo deliberadamente fora do front

- Iniciar / listar / finalizar / cancelar vendas
- Inbox de notificações / marcar como lida / contagem
- Qualquer rota ou regra de negócio não exposta pela API atual
