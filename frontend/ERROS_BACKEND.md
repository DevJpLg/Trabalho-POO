# Erros e limitações do backend

Levantamento feito a partir do código da API (`src/`) enquanto o frontend era integrado.
**Nenhum arquivo do backend foi alterado** — este documento existe para registrar o que
foi encontrado e explicar por que certas telas não existem ou tomam caminhos alternativos.

A checagem de tipos foi rodada em modo somente-leitura (`npx tsc --noEmit`, na raiz do
projeto) e os erros abaixo marcados com 🔴 vêm dela. Em desenvolvimento o servidor sobe
mesmo assim porque `ts-node-dev` roda com `--transpile-only`, ou seja, sem checagem de tipos.

---

## 1. Cliente Prisma desatualizado 🔴

`src/generated/prisma` foi gerado a partir de uma versão anterior do `schema.prisma`: o
cliente não conhece `precoUnitario` nem `exigeAvaliacao` em `ItemVenda`, embora as duas
colunas existam no schema atual.

```
src/modules/itemVenda/itemVenda.repository.ts(33,17): 'precoUnitario' does not exist in type 'ItemVendaCreateInput'
src/modules/itemVenda/itemVenda.repository.ts(79,31): Property 'precoUnitario' does not exist on type ...
src/modules/itemVenda/itemVenda.repository.ts(80,24): Property 'exigeAvaliacao' does not exist on type ...
  (mesmo erro nas linhas 107, 108, 131, 132, 155, 156)
```

**Correção:** rodar `npx prisma generate` (ou `npm run prisma:generate`) antes de subir a API.
Enquanto isso não for feito, gravar e ler item de venda pode falhar em tempo de execução.

## 2. `VendaService` recebido como se fosse a entidade `Venda` 🔴

`prescricao.service.ts` importa `InterfaceVendaService from "../venda"`, mas `../venda`
resolve para `venda/index.ts`, que exporta a **classe de domínio** `Venda` — não uma interface
de service.

```
src/modules/prescricao/prescricao.service.ts(87,54): Property 'buscarVendaPorId' does not exist on type 'Venda'
src/shared/container/index.ts(58,83): Argument of type 'VendaService' is not assignable to parameter of type 'Venda'
```

**Efeito prático:** `GET /api/prescricoes/venda/:vendaId` sempre falha (o método não existe em
tempo de execução → `TypeError` → 400 "Erro ao listar prescrições").

## 3. Reexport inexistente em `notificacao/index.ts` 🔴

```
src/modules/notificacao/index.ts(4,10): '"./notificacao.routes"' has no exported member named 'notificacaoRoutes'
```

O arquivo de rotas exporta `criarNotificacaoRoutes`. Hoje nada importa esse índice, então o
erro é só de compilação — mas quebra `npm run build`.

---

## 4. Rotas que respondem 501 (não implementadas)

| Rota | Situação |
|------|----------|
| `POST /api/vendas` | `VendaController.iniciarVenda` → 501 |
| `GET /api/vendas/:id` | `VendaController.buscarPorId` → 501 |
| `POST/DELETE /api/vendas/:id/itens` | → 501 |
| `PATCH /api/vendas/:id/finalizar` | → 501 |
| `PATCH /api/vendas/:id/cancelar` | → 501 |
| `GET /api/notificacoes` e demais | `NotificacaoController` sem service injetado → 501 |

Só `GET /api/vendas` funciona (e no repositório apenas `listarVendas` está implementado).

**No frontend:** nenhuma tela oferece abrir, finalizar ou cancelar venda, e o sino de
notificações foi removido do cabeçalho. A tela de atendimento seleciona uma venda **já
existente** a partir de `GET /api/vendas`.

## 5. Checagens de perfil com `||` no lugar de `&&`

Isso existia em `realizarBaixa` e `alterarValidade`. O backend passou a usar
`autorizacao.service`, então as rotas dedicadas voltam a funcionar.

**No frontend:** `PATCH /produtos/:id/validade` e `PATCH /produtos/:id/entrada`
são usadas direto. A baixa da tela de produtos (GERENTE) continua por
`PUT /produtos/:id`, porque `PATCH /produtos/:id/baixa` só autoriza ATENDENTE/CAIXA.

## 6. Avaliação farmacêutica inalcançável pela interface

- `itemVendaService.listarItensVenda` exige **ATENDENTE ou CAIXA**
  (`usuarioPodeGerenciarItemVendas`).
- `validacaoItemService.aprovarItem`/`recusarItem` exigem **FARMACEUTICO**
  (`usuarioPodeAvaliarItemVendas`).

O farmacêutico consegue aprovar um item, mas **não consegue listar** os itens de uma venda
para descobrir os IDs — e não há nenhuma outra rota que os exponha para o perfil dele.

Pelo mesmo motivo, `PATCH /api/itens-venda/venda/:vendaId/avaliar` é inalcançável: o
controller lista os itens (ATENDENTE/CAIXA) antes de avaliar (FARMACEUTICO), então recusa
qualquer usuário.

**No frontend:** a tela "Avaliações" mostra as vendas em `EM_AVALIACAO` e as prescrições
vinculadas a cada uma, sem aprovação item a item. Uma linha em
`usuarioPodeAvaliarItemVendas` liberando o farmacêutico na listagem destrava a tela completa.

## 7. `PATCH /api/produtos/:id/entrada` — resolvido no controller

O controller agora responde `200` no sucesso. O frontend chama a rota normalmente,
sem timeout especial.

## 8. `GET /api/prescricoes` quebra com qualquer busca que não seja data

`PrescricaoRepository.listarPrescricoes` monta o filtro assim:

```ts
{ dataEmissao: { gte: new Date(busca) } },
{ dataValidade: { lte: new Date(busca) } },
```

Com `busca` vazia (`new Date("")`) ou textual, o resultado é `Invalid Date` e o Prisma
rejeita a consulta → 400 "Erro ao listar prescrições". Ou seja, a listagem **nunca** funciona
do jeito que a UI naturalmente chamaria.

**No frontend:** a listagem envia `busca=1900-01-01`. É uma data válida e o `OR` inclui
`dataEmissao >= 1900-01-01`, que casa com todos os registros; o filtro por texto é aplicado
no cliente (`prescricao.service.listar`). Validar a entrada antes de montar o `where`
resolve no backend.

## 9. `GET /api/prescricoes/numero/:numeroPrescricao` nunca é alcançada

Em `prescricao.routes.ts` ela é registrada **depois** de `GET /:id`, então o Express casa
primeiro com `/:id` e tenta `Number("numero")` → `NaN`. A linha também termina com um `[]`
solto, provavelmente resto de edição:

```ts
prescricaoRouter.get("/numero/:numeroPrescricao", controller.buscarPrescricaoPorNumeroPrescricao.bind(controller));[]
```

**No frontend:** a rota não é usada.

## 10. `GET /api/usuarios` quebra quando há exatamente 1 resultado

`UsuarioRepository.listarUsuarios` retorna `usuarios.length === 1 ? usuarios[0] : usuarios`.
O controller então chama `.map` sobre um objeto → `TypeError` → 500 do `errorHandler`.

**No frontend:** `GET /usuarios` é chamado **sem** `busca` — com o parâmetro vazio o `contains`
casa com todo mundo e a resposta vem como array sempre que houver dois ou mais usuários. O
filtro por nome, e-mail ou perfil passou a ser feito no cliente
(`usuario.service.listar`), então digitar algo que casa com um único usuário não derruba mais
a tela.

Sobra um caso que só o backend resolve: banco com **um único usuário** (logo depois de rodar
`criar_usuario_admin.sql`). Aí a tela detecta o 500, mostra o próprio usuário logado e avisa o
que está acontecendo, para que dê para cadastrar o segundo e sair do estado. Retornar sempre
array no repositório resolve de vez.

## 11. `cadastrarUsuario` não persiste o CRF

`UsuarioRepository.cadastrarUsuario` monta `data` com `nome`, `email`, `senha` e `perfil`;
`numeroCRF` fica de fora, mesmo existindo na tabela e sendo pedido para o farmacêutico.

**No frontend:** o campo continua no formulário, com aviso de que a API ainda não grava o dado.

## 12. Lista vazia responde 400 em vez de 200 com `[]`

Acontece em produtos, itens de venda, prescrições e validades — por exemplo
`"Nenhum produto encontrado"` com status 400 quando a consulta funcionou e só não achou nada.

**No frontend:** `shared/http/getErrorMessage.ts` reconhece essas mensagens e as trata como
lista vazia, mostrando o estado "nenhum registro" em vez de um alerta vermelho.

## 13. Dois formatos de erro

Controllers respondem `{ message }`; o `errorHandler` global responde `{ error }`.
O `HttpClient` do frontend aceita os dois.

## 14. Sem CORS no Express

`src/app.ts` não usa `cors`. Em desenvolvimento isso é contornado pelo proxy do Vite
(`/api` → `http://localhost:3333`). Para publicar o frontend em outra origem será preciso
adicionar o middleware.

## 15. Validação de CRM depende de token externo

`CrmService.validarCrm` consulta `consultacrm.com.br` usando `CONSULTAR_IO_TOKEN`, que está
vazio no `.env`. Sem token, cadastrar ou editar prescrição tende a falhar com
"CRM inexistente" — é configuração, não bug de código, mas trava a tela de prescrições.

---

## Regras de autorização que o frontend segue

Estão espelhadas em `src/shared/auth/permissoes.ts`, lidas dos services (e não do README,
que diverge em alguns pontos):

| Ação | Perfis autorizados pelo backend |
|------|--------------------------------|
| CRUD de usuários | GERENTE |
| `GET /produtos` (catálogo completo) | GERENTE, FARMACEUTICO |
| CRUD de produto e `PATCH /produtos/:id/entrada|validade` | GERENTE |
| `PATCH /produtos/:id/baixa` | ATENDENTE, CAIXA |
| `GET /produtos/busca` (catálogo vendável) | qualquer autenticado |
| `GET /produtos/validades` e `PATCH /produtos/:id/bloquear|desbloquear` | FARMACEUTICO |
| Itens de venda (listar, adicionar, alterar, remover, total) | ATENDENTE, CAIXA |
| Aprovar/recusar item | FARMACEUTICO |
| `GET /vendas` | qualquer autenticado |
| Prescrições (CRUD) | qualquer autenticado (sem checagem no backend) |
