<div align="center">
  <h1>Farmácia Bairro Saúde</h1>
  <p><strong>Sistema de gestão operacional para farmácias de pequeno porte.</strong></p>
  <p>
    <i>POO - Instituto Federal Fluminense (IFF) - Campus Campos Centro</i><br>
    <i>Alunos: João Pedro Lopes e Mateus Ramos | Professora: Renata Mesquita</i>
  </p>
</div>

## Visão Geral

O sistema gerencia o fluxo completo de uma farmácia: **estoque, vendas e prescrições médicas**. Ele lida com quatro perfis de usuário, garantindo segurança na venda de medicamentos controlados.

- 👔 **Gerente**: Acesso total administrativo.
- 🛒 **Atendente**: Inicia vendas e adiciona produtos.
- 🩺 **Farmacêutico**: Valida prescrições de medicamentos controlados.
- 💳 **Caixa**: Processa pagamentos e finaliza vendas.

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| : | : |
| **Backend** | TypeScript, Node.js, Express, `ts-node-dev` |
| **Banco & ORM** | MySQL, Prisma ORM (v7 + Driver Adapter) |
| **Frontend** | React, Tailwind CSS *(Escopo Futuro)* |

## Como Rodar Localmente

### 1. Preparação
```bash
git clone <URL_DO_REPOSITORIO>
cd Trabalho-POO
npm install
```

### 2. Configurar Ambiente (`.env`)
Duplique o arquivo `.env.example` e renomeie para `.env`.
> ⚠️ **Atenção:** Atualize a senha (`DATABASE_PASSWORD` e `DATABASE_URL`) com a sua **senha real do MySQL local**.

```env
DATABASE_URL="mysql://root:SUA_SENHA_AQUI@localhost:3306/farmacia_bairro_saude"
DATABASE_HOST="localhost"
DATABASE_USER="root"
DATABASE_PASSWORD="SUA_SENHA_AQUI"
DATABASE_PORT=3306
DATABASE_NAME="farmacia_bairro_saude"
PORT=3333
```

### 3. Criar Banco e Inserir Dados (Script `seed.sql`)
Para que o sistema funcione com dados e tabelas, é preciso rodar o script [**`prisma/seed.sql`**](prisma/seed.sql).

<details open>
<summary><b>🔹 Opção A: Usando o DBeaver (Recomendado)</b></summary>

1. Conecte-se ao seu MySQL local no DBeaver.
2. Abra o arquivo `prisma/seed.sql`.
3. Selecione a conexão MySQL no **topo da aba do script**.
4. Pressione `Alt + X` para rodar e popular todo o banco.
</details>

<details>
<summary><b>🔹 Opção B: Via Terminal / CMD</b></summary>

No terminal do VS Code, execute:
```bash
mysql -u root -p < prisma/seed.sql
```
*(Digite sua senha do MySQL quando solicitado).*
</details>

### 4. Rodar o Projeto
- **Iniciar Servidor API**: `npm run dev` *(roda em http://localhost:3333)*
- **Visualizar Banco (Prisma Studio)**: `npx prisma studio` *(roda em http://localhost:5555)*



## 📁 Arquitetura (Bounded Contexts)

O backend adota uma arquitetura modular baseada em domínio. Cada pasta em `src/modules/` (como `usuario`, `produto`, `venda`) é independente e contém suas próprias camadas de `controller`, `service`, `repository` e `routes`.

<details>
<summary><b>Ver Estrutura de Pastas Resumida</b></summary>

```text
farmacia-bairro-saude/
├── prisma/
│   ├── schema.prisma      # Modelagem Oficial do Banco
│   └── seed.sql           # Script de Criação e Dados de Teste
├── src/
│   ├── modules/           # Módulos de Domínio (Venda, Produto, etc)
│   ├── shared/            # Middlewares, Errors, Roteador Principal e Prisma Client
│   └── server.ts          # Entrypoint do Express
```
</details>



## Regras de Negócio

1. **Validade & Estoque:**
   - Produtos vencidos **não** podem ser vendidos.
   - O estoque real (`quantidadeEstoque`) só é descontado quando a venda é **FINALIZADA** pelo Caixa.
2. **Produtos Restritos:**
   - Vender medicamentos classificados como `CONTROLADO` ou `PRESCRITO` muda o status da venda para `EM_AVALIACAO`.
   - Exige registro de uma `Prescricao` e notificação ao `FARMACEUTICO`.
   - A venda só avança para o pagamento após aprovação (`aprovadoFarmaceutico = true`).
3. **Padrões de Código:**
   - Valores monetários (`preco`) devem usar `Decimal` (`Decimal.js`) para precisão.
   - O `PrismaClient` é singleton e injetado a partir de `src/shared/database/prismaClient.ts`.
   - Respeitar a separação: **Controller** (req/res) ➔ **Service** (regras) ➔ **Repository** (banco).