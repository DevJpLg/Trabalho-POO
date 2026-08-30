-- =============================================================================
-- Farmácia Bairro Saúde — Script de Criação e Dados de Teste
-- =============================================================================
-- Banco: MySQL
-- Objetivo: Criar todas as tabelas do sistema e popular com dados realistas
--           para desenvolvimento e testes locais.
--
-- IMPORTANTE:
--   - Este script é para ambiente de DESENVOLVIMENTO/TESTE, não de produção.
--   - Os nomes de tabela e coluna espelham fielmente o schema.prisma (@@map).
--   - As senhas dos usuários de exemplo são hashes bcrypt FICTÍCIOS
--     (não representam senhas reais; servem apenas para preencher a coluna).
--   - O script pode ser executado repetidas vezes — os DROPs no início
--     limpam tudo antes de recriar.
--
-- Ordem de execução:
--   1. DROP das tabelas (ordem inversa das dependências)
--   2. CREATE TABLE (ordem direta das dependências)
--   3. INSERT de dados de exemplo
-- =============================================================================

-- Selecionar / criar o banco
CREATE DATABASE IF NOT EXISTS farmacia_bairro_saude
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE farmacia_bairro_saude;

-- =============================================================================
-- 1. DROP TABLES (ordem inversa de dependência para evitar erros de FK)
-- =============================================================================

DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS prescricoes;
DROP TABLE IF EXISTS itens_venda;
DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS usuarios;

-- =============================================================================
-- 2. CREATE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- usuarios (model Usuario)
-- Perfil único por usuário; numeroCRF preenchido apenas para FARMACEUTICO.
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id        INT           NOT NULL AUTO_INCREMENT,
  nome      VARCHAR(150)  NOT NULL,
  email     VARCHAR(200)  NOT NULL,
  senha     VARCHAR(255)  NOT NULL,
  ehAtivo   BOOLEAN       NOT NULL DEFAULT TRUE,
  perfil    ENUM('GERENTE','ATENDENTE','FARMACEUTICO','CAIXA') NOT NULL,
  numeroCRF VARCHAR(20)   NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- produtos (model Produto)
-- quantidadeEstoque faz o papel do controle de estoque (sem tabela separada).
-- preco armazenado como DECIMAL(10,2) para precisão monetária.
-- -----------------------------------------------------------------------------
CREATE TABLE produtos (
  id                  INT            NOT NULL AUTO_INCREMENT,
  nome                VARCHAR(200)   NOT NULL,
  codigoBarras        VARCHAR(50)    NOT NULL,
  descricao           TEXT           NULL,
  principioAtivo      VARCHAR(200)   NOT NULL,
  concentracao        VARCHAR(50)    NULL,
  formaFarmaceutica VARCHAR(100)   NULL,
  fabricante          VARCHAR(200)   NOT NULL,
  numeroRegAnvisa     VARCHAR(30)    NULL,
  tarja               VARCHAR(30)    NULL,
  categoria           VARCHAR(80)    NULL,
  classificacao       ENUM('LIVRE','CONTROLADO','PRESCRITO') NOT NULL DEFAULT 'LIVRE',
  quantidadeEstoque   INT            NOT NULL DEFAULT 0,
  localEstoque        VARCHAR(100)   NULL,
  validade            DATETIME       NULL,
  classeControle      VARCHAR(30)    NULL,
  retencaoReceita     BOOLEAN        NOT NULL DEFAULT FALSE,
  validadeReceita     INT            NULL,
  generico            BOOLEAN        NOT NULL DEFAULT FALSE,
  lote                VARCHAR(50)    NULL,
  preco               DECIMAL(10,2)  NOT NULL,
  dataFabricacao      DATETIME       NULL,
  quantidadeMaxima    INT            NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_produtos_codigoBarras (codigoBarras)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- vendas (model Venda)
-- Precisa de atendenteId ou caixaId (pelo menos um).
-- -----------------------------------------------------------------------------
CREATE TABLE vendas (
  id          INT      NOT NULL AUTO_INCREMENT,
  dataHora    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status      ENUM('EM_ANDAMENTO','EM_AVALIACAO','AGUARDANDO_PAGAMENTO','FINALIZADA','CANCELADA')
              NOT NULL DEFAULT 'EM_ANDAMENTO',
  atendenteId    INT      NULL,
  caixaId        INT      NULL,
  -- Farmacêutico que avaliou a venda (relação de avaliação, não de operação de venda)
  farmaceuticoId INT      NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_vendas_atendente    FOREIGN KEY (atendenteId)    REFERENCES usuarios(id),
  CONSTRAINT fk_vendas_caixa        FOREIGN KEY (caixaId)        REFERENCES usuarios(id),
  CONSTRAINT fk_vendas_farmaceutico FOREIGN KEY (farmaceuticoId) REFERENCES usuarios(id),
  CONSTRAINT chk_venda_atendente_ou_caixa CHECK (atendenteId IS NOT NULL OR caixaId IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- itens_venda (model ItemVenda)
-- precoUnitario congela o preço do produto no momento da venda.
-- exigeAvaliacao congela se o item precisa de avaliação do farmacêutico.
-- aprovadoFarmaceutico indica se o farmacêutico validou o item.
-- -----------------------------------------------------------------------------
CREATE TABLE itens_venda (
  id                   INT           NOT NULL AUTO_INCREMENT,
  quantidade           INT           NOT NULL,
  precoUnitario        DECIMAL(10,2) NOT NULL,
  exigeAvaliacao       BOOLEAN       NOT NULL DEFAULT FALSE,
  aprovadoFarmaceutico BOOLEAN       NOT NULL DEFAULT FALSE,
  vendaId              INT           NOT NULL,
  produtoId            INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_itens_venda_venda   FOREIGN KEY (vendaId)   REFERENCES vendas(id),
  CONSTRAINT fk_itens_venda_produto FOREIGN KEY (produtoId) REFERENCES produtos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- prescricoes (model Prescricao)
-- Vinculada a Venda (1 venda : 0..* prescrições).
-- anexo armazena caminho/URL do arquivo digitalizado, não o binário.
-- -----------------------------------------------------------------------------
CREATE TABLE prescricoes (
  id                INT          NOT NULL AUTO_INCREMENT,
  numeroPrescricao  VARCHAR(50)  NOT NULL,
  nomeMedico        VARCHAR(200) NOT NULL,
  numeroCrm         VARCHAR(20)  NOT NULL,
  ufCrm             CHAR(2)      NOT NULL,
  nomePaciente      VARCHAR(200) NOT NULL,
  retencao          BOOLEAN      NOT NULL DEFAULT FALSE,
  dataEmissao       DATETIME     NOT NULL,
  dataValidade      DATETIME     NOT NULL,
  anexo             VARCHAR(500) NULL,
  retida            BOOLEAN      NOT NULL DEFAULT FALSE,
  quantidadeMaxima  INT          NULL,
  vendaId           INT          NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_prescricoes_venda FOREIGN KEY (vendaId) REFERENCES vendas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notificacoes (model Notificacao)
-- Notificação compartilhada: uma ocorrência por venda prescrita.
-- Quando resolvida = TRUE, deixa de aparecer para todos os farmacêuticos.
-- -----------------------------------------------------------------------------
CREATE TABLE notificacoes (
  id        INT      NOT NULL AUTO_INCREMENT,
  tipo      ENUM('VENDA_PRESCRITA') NOT NULL,
  dataHora  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolvida BOOLEAN  NOT NULL DEFAULT FALSE,
  vendaId   INT      NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_notificacoes_venda FOREIGN KEY (vendaId) REFERENCES vendas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. INSERT — Dados de Exemplo para Desenvolvimento/Teste
-- =============================================================================
-- ATENÇÃO: As senhas abaixo são hashes bcrypt FICTÍCIOS gerados para a string
-- "Senha@123". NÃO são senhas reais e servem apenas para popular a coluna.
-- Em produção, o hash deve ser gerado pela aplicação (ex: bcryptjs).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 Usuários (um de cada perfil)
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (id, nome, email, senha, ehAtivo, perfil, numeroCRF) VALUES
  (1, 'Carlos Gerente',      'carlos.gerente@farmacia.com',    '$2b$10$K3xFZr1Q7qY8vE9wLm5NZeOp2rS4tU6vW8xAyB1cD3eF5gH7iJ9kL', TRUE,  'GERENTE',      NULL),
  (2, 'Ana Atendente',       'ana.atendente@farmacia.com',     '$2b$10$M4yG0sH2rI8wF1xJ3kL5NeQp6tR9vU2xAyB4cD7eF0gH3iJ6kL8mN', TRUE,  'ATENDENTE',    NULL),
  (3, 'Dr. Pedro Farmacêutico', 'pedro.farmaceutico@farmacia.com', '$2b$10$O5zH1tI3sJ9xG2yK4lM6NfRq7uS0wV3yBzC5dE8fG1hI4jK7lM9nO', TRUE,  'FARMACEUTICO', 'CRF-RJ-12345'),
  (4, 'Maria Caixa',         'maria.caixa@farmacia.com',       '$2b$10$Q6aI2uJ4tK0yH3zL5mN7OgSr8vT1xW4zCaD6eF9gH2iJ5kL8mN0oP', TRUE,  'CAIXA',        NULL),
  (5, 'Roberto Atendente',   'roberto.atendente@farmacia.com', '$2b$10$S7bJ3vK5uL1zI4aM6nO8PhTs9wU2yX5aDcE7fG0hI3jK6lM9nO1pQ', TRUE,  'ATENDENTE',    NULL),
  (6, 'Dra. Lucia Farmacêutica', 'lucia.farmaceutica@farmacia.com', '$2b$10$U8cK4wL6vM2aJ5bN7oP9QiUt0xV3zY6bEdF8gH1iJ4kL7mN0oP2qR', TRUE,  'FARMACEUTICO', 'CRF-RJ-67890'),
  (7, 'José Inativo',        'jose.inativo@farmacia.com',      '$2b$10$W9dL5xM7wN3bK6cO8pQ0RjVu1yW4aZ7cFgG9hI2jK5lM8nO1pQ3rS', FALSE, 'ATENDENTE',    NULL);

-- -----------------------------------------------------------------------------
-- 3.2 Produtos
-- Incluem: venda livre, controlados, prescritos, vencidos, próximos do vencimento.
-- -----------------------------------------------------------------------------
INSERT INTO produtos (id, nome, codigoBarras, descricao, principioAtivo, concentracao, formaFarmaceutica, fabricante, numeroRegAnvisa, tarja, categoria, classificacao, quantidadeEstoque, localEstoque, validade, classeControle, retencaoReceita, validadeReceita, generico, lote, preco, dataFabricacao, quantidadeMaxima) VALUES

-- Produtos de venda LIVRE (dentro da validade)
(1,  'Dipirona Sódica 500mg',
     '7891234560001', 'Analgésico e antitérmico',
     'Dipirona Sódica', '500mg', 'Comprimido', 'EMS',
     '1234567890', 'Sem tarja', 'Analgésico', 'LIVRE',
     200, 'Prateleira A1', '2027-06-15 00:00:00', NULL,
     FALSE, NULL, TRUE, 'LOT-2024A', 8.90, '2024-06-15 00:00:00', NULL),

(2,  'Paracetamol 750mg',
     '7891234560002', 'Analgésico e antitérmico',
     'Paracetamol', '750mg', 'Comprimido', 'Medley',
     '1234567891', 'Sem tarja', 'Analgésico', 'LIVRE',
     150, 'Prateleira A1', '2027-08-20 00:00:00', NULL,
     FALSE, NULL, TRUE, 'LOT-2024B', 6.50, '2024-08-20 00:00:00', NULL),

(3,  'Ibuprofeno 400mg',
     '7891234560003', 'Anti-inflamatório não esteroidal',
     'Ibuprofeno', '400mg', 'Comprimido', 'Neo Química',
     '1234567892', 'Sem tarja', 'Anti-inflamatório', 'LIVRE',
     80, 'Prateleira A2', '2027-03-10 00:00:00', NULL,
     FALSE, NULL, TRUE, 'LOT-2024C', 12.90, '2024-03-10 00:00:00', NULL),

-- Produto LIVRE mas VENCIDO (não pode ser vendido)
(4,  'Vitamina C 1g Efervescente',
     '7891234560004', 'Suplemento vitamínico',
     'Ácido Ascórbico', '1g', 'Comprimido Efervescente', 'Bayer',
     '1234567893', 'Sem tarja', 'Vitamina', 'LIVRE',
     30, 'Prateleira B1', '2025-01-15 00:00:00', NULL,
     FALSE, NULL, FALSE, 'LOT-2023A', 15.90, '2023-01-15 00:00:00', NULL),

-- Produto LIVRE próximo do vencimento (validade em 30 dias)
(5,  'Loratadina 10mg',
     '7891234560005', 'Anti-histamínico',
     'Loratadina', '10mg', 'Comprimido', 'EMS',
     '1234567894', 'Sem tarja', 'Antialérgico', 'LIVRE',
     15, 'Prateleira B2', '2026-08-20 00:00:00', NULL,
     FALSE, NULL, TRUE, 'LOT-2024D', 9.90, '2024-02-20 00:00:00', NULL),

-- Produto PRESCRITO (tarja vermelha, exige receita simples)
(6,  'Amoxicilina 500mg',
     '7891234560006', 'Antibiótico de amplo espectro',
     'Amoxicilina', '500mg', 'Cápsula', 'Eurofarma',
     '1234567895', 'Tarja Vermelha', 'Antibiótico', 'PRESCRITO',
     60, 'Prateleira C1', '2027-05-01 00:00:00', NULL,
     FALSE, 30, FALSE, 'LOT-2024E', 22.50, '2024-05-01 00:00:00', 2),

(7,  'Azitromicina 500mg',
     '7891234560007', 'Antibiótico macrolídeo',
     'Azitromicina', '500mg', 'Comprimido', 'Medley',
     '1234567896', 'Tarja Vermelha', 'Antibiótico', 'PRESCRITO',
     40, 'Prateleira C1', '2027-07-15 00:00:00', NULL,
     FALSE, 30, FALSE, 'LOT-2024F', 35.00, '2024-07-15 00:00:00', 1),

-- Produto CONTROLADO (tarja preta, exige receita especial com retenção)
(8,  'Clonazepam 2mg',
     '7891234560008', 'Ansiolítico benzodiazepínico',
     'Clonazepam', '2mg', 'Comprimido', 'Roche',
     '1234567897', 'Tarja Preta', 'Ansiolítico', 'CONTROLADO',
     25, 'Armário Controlado', '2027-09-30 00:00:00', 'B1',
     TRUE, 30, FALSE, 'LOT-2024G', 18.70, '2024-09-30 00:00:00', 1),

(9,  'Ritalina 10mg',
     '7891234560009', 'Estimulante do sistema nervoso central',
     'Metilfenidato', '10mg', 'Comprimido', 'Novartis',
     '1234567898', 'Tarja Preta', 'Psicoestimulante', 'CONTROLADO',
     20, 'Armário Controlado', '2027-11-15 00:00:00', 'A3',
     TRUE, 30, FALSE, 'LOT-2024H', 42.00, '2024-11-15 00:00:00', 1),

-- Produto CONTROLADO VENCIDO (não pode ser vendido)
(10, 'Diazepam 10mg',
     '7891234560010', 'Ansiolítico benzodiazepínico',
     'Diazepam', '10mg', 'Comprimido', 'União Química',
     '1234567899', 'Tarja Preta', 'Ansiolítico', 'CONTROLADO',
     10, 'Armário Controlado', '2025-03-01 00:00:00', 'B1',
     TRUE, 30, FALSE, 'LOT-2023B', 14.50, '2023-03-01 00:00:00', 1);

-- -----------------------------------------------------------------------------
-- 3.3 Vendas (uma em cada status do fluxo)
-- -----------------------------------------------------------------------------
INSERT INTO vendas (id, dataHora, status, atendenteId, caixaId, farmaceuticoId) VALUES

-- Venda 1: EM_ANDAMENTO — atendente iniciou, só itens livres por ora
(1, '2026-07-21 09:00:00', 'EM_ANDAMENTO', 2, NULL, NULL),

-- Venda 2: EM_AVALIACAO — tem produto prescrito, aguardando farmacêutico
(2, '2026-07-21 10:15:00', 'EM_AVALIACAO', 2, NULL, NULL),

-- Venda 3: AGUARDANDO_PAGAMENTO — farmacêutico já aprovou, caixa ainda não finalizou
(3, '2026-07-21 11:30:00', 'AGUARDANDO_PAGAMENTO', 5, NULL, 3),

-- Venda 4: FINALIZADA — fluxo completo (atendente → avaliação farmacêutico → caixa)
(4, '2026-07-20 14:00:00', 'FINALIZADA', 2, 4, 3),

-- Venda 5: CANCELADA — venda que foi abortada
(5, '2026-07-19 16:45:00', 'CANCELADA', 5, NULL, NULL);

-- -----------------------------------------------------------------------------
-- 3.4 Itens de Venda
-- Regras respeitadas:
--   - Venda FINALIZADA (4): todos os itens controlados com aprovadoFarmaceutico=TRUE.
--   - Venda EM_AVALIACAO (2): itens controlados com aprovadoFarmaceutico=FALSE.
--   - Produto vencido NÃO aparece em nenhuma venda finalizada.
-- -----------------------------------------------------------------------------
INSERT INTO itens_venda (id, quantidade, precoUnitario, exigeAvaliacao, aprovadoFarmaceutico, vendaId, produtoId) VALUES

-- Venda 1 (EM_ANDAMENTO): apenas itens livres
(1,  2, 8.90,  FALSE, FALSE, 1, 1),   -- 2x Dipirona (livre, não precisa aprovação)
(2,  1, 6.50,  FALSE, FALSE, 1, 2),   -- 1x Paracetamol (livre)

-- Venda 2 (EM_AVALIACAO): tem prescrito aguardando aprovação
(3,  1, 12.90, FALSE, FALSE, 2, 3),   -- 1x Ibuprofeno (livre)
(4,  1, 22.50, TRUE,  FALSE, 2, 6),   -- 1x Amoxicilina (prescrito, PENDENTE aprovação)
(5,  1, 18.70, TRUE,  FALSE, 2, 8),   -- 1x Clonazepam (controlado, PENDENTE aprovação)

-- Venda 3 (AGUARDANDO_PAGAMENTO): farmacêutico já aprovou tudo
(6,  2, 8.90,  FALSE, FALSE, 3, 1),   -- 2x Dipirona (livre, não precisa)
(7,  1, 35.00, TRUE,  TRUE,  3, 7),   -- 1x Azitromicina (prescrito, APROVADO)

-- Venda 4 (FINALIZADA): todos aprovados, pagamento confirmado
(8,  3, 6.50,  FALSE, FALSE, 4, 2),   -- 3x Paracetamol (livre)
(9,  1, 22.50, TRUE,  TRUE,  4, 6),   -- 1x Amoxicilina (prescrito, APROVADO)
(10, 1, 42.00, TRUE,  TRUE,  4, 9),   -- 1x Ritalina (controlado, APROVADO)

-- Venda 5 (CANCELADA): itens ficaram pendentes
(11, 1, 8.90,  FALSE, FALSE, 5, 1),   -- 1x Dipirona (livre)
(12, 1, 18.70, TRUE,  FALSE, 5, 8);   -- 1x Clonazepam (controlado, nunca aprovado — venda cancelada)

-- -----------------------------------------------------------------------------
-- 3.5 Prescrições
-- Vinculadas a vendas que contêm produtos controlados/prescritos.
-- Vendas 1 e 5 não têm prescrição (livre / cancelada antes).
-- -----------------------------------------------------------------------------
INSERT INTO prescricoes (id, numeroPrescricao, nomeMedico, numeroCrm, ufCrm, nomePaciente, retencao, dataEmissao, dataValidade, anexo, retida, quantidadeMaxima, vendaId) VALUES

-- Prescrição da Venda 2 (EM_AVALIACAO) — receita ainda em análise
(1, 'REC-2026-0001', 'Dr. Marcos Silva',    '54321', 'RJ', 'João da Silva',
    TRUE,  '2026-07-20 00:00:00', '2026-08-19 00:00:00',
    '/uploads/prescricoes/rec-2026-0001.pdf', FALSE, 1, 2),

-- Prescrição da Venda 3 (AGUARDANDO_PAGAMENTO) — receita já validada
(2, 'REC-2026-0002', 'Dra. Fernanda Costa', '98765', 'SP', 'Maria Oliveira',
    FALSE, '2026-07-19 00:00:00', '2026-08-18 00:00:00',
    '/uploads/prescricoes/rec-2026-0002.pdf', FALSE, 1, 3),

-- Prescrição da Venda 4 (FINALIZADA) — receita validada e retida (controlado)
(3, 'REC-2026-0003', 'Dr. Paulo Mendes',    '11223', 'MG', 'Carlos Pereira',
    TRUE,  '2026-07-18 00:00:00', '2026-08-17 00:00:00',
    '/uploads/prescricoes/rec-2026-0003.pdf', TRUE, 1, 4);

-- -----------------------------------------------------------------------------
-- 3.6 Notificações
-- Uma notificação compartilhada por venda prescrita (não há cópia por farmacêutico).
-- -----------------------------------------------------------------------------
INSERT INTO notificacoes (id, tipo, dataHora, resolvida, vendaId) VALUES

-- Venda 2 (EM_AVALIACAO): ainda pendente — visível para todos os farmacêuticos
(1, 'VENDA_PRESCRITA', '2026-07-21 10:16:00', FALSE, 2),

-- Venda 3 (AGUARDANDO_PAGAMENTO): já atendida — não aparece na listagem
(2, 'VENDA_PRESCRITA', '2026-07-21 11:31:00', TRUE, 3),

-- Venda 4 (FINALIZADA): já atendida — não aparece na listagem
(3, 'VENDA_PRESCRITA', '2026-07-20 14:01:00', TRUE, 4);

-- =============================================================================
-- Fim do script
-- =============================================================================