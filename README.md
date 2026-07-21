# Farmácia Bairro Saúde

> Desenvolvido para a disciplina de **Programação Orientada a Objetos (POO)**  
> **Instituição:** Instituto Federal Fluminense (IFF) - Campus Campos Centro  
> **Professora:** Renata Mesquita  
> **Alunos:** João Pedro Lopes e Mateus Ramos

## 📌 Visão Geral

O **Farmácia Bairro Saúde** é a base de um sistema de gestão para farmácias de pequeno porte. O sistema busca resolver o controle operacional do estabelecimento, abrangendo a gestão de estoque, o fluxo completo de vendas e a validação/retenção de prescrições médicas para medicamentos controlados ou restritos.

O sistema trabalha com quatro perfis de usuário bem definidos:
1. **Gerente**: Acesso total, incluindo cadastros de usuários e acompanhamento geral.
2. **Atendente**: Inicia vendas e adiciona medicamentos/itens ao carrinho.
3. **Farmacêutico**: Avalia e valida prescrições médicas exigidas para medicamentos controlados/prescritos, emitindo aprovações e recebendo notificações de pendências.
4. **Caixa**: Processa o pagamento de vendas aguardando pagamento e finaliza a transação.

## 🛠️ Stack Tecnológica

### Backend (Implementação Atual)
- **Linguagem:** TypeScript (Node.js)
- **Framework Web:** Express
- **ORM:** Prisma ORM (versão 7.x com Driver Adapter)
- **Banco de Dados:** MySQL
- **Execução / Live Reload:** `ts-node-dev`

### Frontend (Escopo Futuro)
- **Framework:** React
- **Estilização:** Tailwind CSS

## 📁 Estrutura do Projeto

O código-fonte segue uma arquitetura modularizada por domínio (Bounded Contexts), onde cada funcionalidade fica isolada dentro da pasta `src/modules/` contendo 4 camadas bem separadas: `controller`, `service`, `repository` e `routes`.

```text
farmacia-bairro-saude/
├── .env                        # Variáveis de ambiente locais
├── .env.example                # Modelo de variáveis de ambiente
├── .gitignore                  # Regras de exclusão do Git
├── package.json                # Dependências e scripts do Node.js
├── tsconfig.json               # Configurações do compilador TypeScript
├── prisma.config.ts            # Arquivo de configuração de datasource do Prisma 7
│
├── prisma/
│   ├── schema.prisma           # Schema do banco de dados (Models, Enums e Relacionamentos)
│   └── seed.sql                # Script SQL de criação de tabelas e dados de teste/desenvolvimento
│
└── src/
    ├── app.ts                  # Instância do Express, middlewares globais e rotas
    ├── server.ts               # Ponto de entrada do servidor HTTP
    │
    ├── generated/
    │   └── prisma/             # Código tipado do Prisma Client (gerado automaticamente)
    │
    ├── modules/                # Módulos organizados por contexto de domínio
    │   ├── usuario/            # Usuários, perfis (Gerente, Atendente, Caixa, Farmacêutico) e CRF
    │   ├── produto/            # Cadastro de medicamentos, lote, validade, preços e classificação
    │   ├── estoque/            # Consultas de disponibilidade, entradas e saídas de estoque
    │   ├── venda/              # Ciclo de vida da venda (abertura, adição de itens, checkout)
    │   ├── prescricao/         # Receitas médicas, CRM, retenção, limites e anexos
    │   └── notificacao/        # Alertas emitidos para farmacêuticos sobre prescrições pendentes
    │
    └── shared/                 # Recursos transversais compartilhados
        ├── database/           # Singleton do Prisma Client utilizando o adapter MySQL (@prisma/adapter-mariadb)
        ├── errors/             # Classe customizada AppError para padronização de erros HTTP
        ├── middleware/         # Handlers globais de erro (errorHandler) e autenticação (authGuard)
        └── routes/             # Roteador central (/api) agregando os endpoints dos módulos
```

## 🗄️ Modelo de Dados (Prisma Schema)

O banco de dados foi projetado em MySQL através do Prisma ORM (`prisma/schema.prisma`). Abaixo estão as principais entidades e seus papéis no sistema:

- **`Usuario`**: Armazena a conta de acesso ao sistema com o perfil (`TipoPerfil`: `GERENTE`, `ATENDENTE`, `FARMACEUTICO`, `CAIXA`). O campo `numeroCRF` é preenchido para farmacêuticos.
- **`Produto`**: Representa os medicamentos e itens da farmácia. Contém dados como `codigoBarras`, `principioAtivo`, `tarja`, `classificacao` (`LIVRE`, `CONTROLADO`, `PRESCRITO`), `quantidadeEstoque`, `preco` (`Decimal`), `validade` e `quantidadeMaxima` por receita.
- **`Venda`**: Registra o fluxo de venda associado obrigatoriamente a um `atendenteId` (Atendente) e opcionalmente a um `caixaId` (Caixa). Possui um status (`StatusVenda`: `EM_ANDAMENTO`, `EM_AVALIACAO`, `AGUARDANDO_PAGAMENTO`, `FINALIZADA`, `CANCELADA`).
- **`ItemVenda`**: Relaciona a `Venda` a um `Produto` com sua quantidade e o flag `aprovadoFarmaceutico`.
- **`Prescricao`**: Guarda informações da receita médica vinculada à `Venda` (médico, CRM/UF, paciente, anexo/digitalização, datas de emissão/validade, retenção de receita e limites).
- **`Notificacao`**: Registra mensagens enviadas ao Farmacêutico (`farmaceuticoId`) referente a vendas que demandam avaliação de prescrição (`vendaId`).

## 🚦 Status do Projeto & Roadmap

### 📊 Status Atual (Etapas 1 e 2 Concluídas)
- [x] Estrutura de diretórios em TypeScript por módulos/domínios.
- [x] Configurações de ambiente, TypeScript e dependências base.
- [x] Schema do Prisma (`schema.prisma`) modelado em MySQL com todas as entidades, enums e relacionamentos.
- [x] Script SQL (`prisma/seed.sql`) de criação e população do banco com dados de teste realistas.
- [x] Integração com Prisma 7 utilizando `prisma.config.ts` e `@prisma/adapter-mariadb`.
- [x] Geração do Prisma Client (`prisma generate`) em `src/generated/prisma`.
- [x] Boilerplate das camadas de Controller, Service, Repository e Routes em cada módulo.

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- **Node.js** (v18+ recomendado)
- **MySQL Server** (rodando localmente ou via Docker)

### Passo a Passo

1. **Clonar o repositório e entrar na pasta:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd Trabalho-POO
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar as variáveis de ambiente:**
   Crie um arquivo `.env` baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Ajuste as credenciais do MySQL no arquivo `.env`:
   ```env
   DATABASE_URL="mysql://root:suasenha@localhost:3306/farmacia_bairro_saude"
   DATABASE_HOST="localhost"
   DATABASE_PORT=3306
   DATABASE_USER="root"
   DATABASE_PASSWORD="suasenha"
   DATABASE_NAME="farmacia_bairro_saude"
   PORT=3333
   ```

4. **Popular o banco de dados com a estrutura e dados de teste (opção via SQL direto):**
   ```bash
   mysql -u root -p < prisma/seed.sql
   ```
   *(Ou execute `npx prisma migrate dev --name init` e `npx prisma generate` se preferir gerenciar via Prisma CLI).*

5. **Iniciar o servidor em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O servidor iniciará em `http://localhost:3333`.

## 🤖 Guia de Contexto para Colaboradores e IAs Futuras

Esta seção resume as **regras de negócio fundamentais** e as **decisões de arquitetura** do projeto para servir de contexto rápido em futuras sessões de desenvolvimento ou em prompts para modelos de IA.

### ⚖️ Regras de Domínio Fundamentais
1. **Validade de Produto:** Medicamentos com data de validade vencida (`validade < dataAtual`) não podem ser adicionados a uma venda nem ter sua saída de estoque efetuada.
2. **Produtos Restritos / Controlados:**
   - Se uma venda incluir ao menos um `Produto` com `classificacao` `CONTROLADO` ou `PRESCRITO`:
     - O status da venda passa para `EM_AVALIACAO`.
     - Uma `Prescricao` precisa ser cadastrada e associada à `Venda`.
     - Uma `Notificacao` deve ser enviada para os usuários do perfil `FARMACEUTICO`.
     - O Farmacêutico deve validar a receita e marcar `aprovadoFarmaceutico = true` no `ItemVenda`.
3. **Baixa de Estoque e Finalização:**
   - A baixa real no estoque (`quantidadeEstoque`) **só deve ocorrer quando o Caixa confirmar o pagamento** e a venda mudar para o status `FINALIZADA`.
   - Vendas com produtos restritos só podem avançar para `AGUARDANDO_PAGAMENTO` após a aprovação do Farmacêutico.
4. **Perfis de Usuário:**
   - `numeroCRF` só é aplicável e obrigatório para usuários com `perfil == FARMACEUTICO`.
   - Vendas são iniciadas por um `Atendente` (`atendenteId`) e concluídas por um `Caixa` (`caixaId`).

### 🏗️ Decisões de Arquitetura & Código
- **Não alterar a estrutura de pastas existente:** Mantenha o padrão `controller` -> `service` -> `repository` dentro de `src/modules/<modulo>/`.
- **Prisma Client:** A instância singleton fica em `src/shared/database/prismaClient.ts` e importa o cliente gerado em `@modules/` ou `../generated/prisma`.
- **Decimais:** Valores monetários (`preco`) devem ser manipulados via tipo `Decimal` do Prisma/Decimal.js para evitar inconsistências de ponto flutuante.