-- Cria (ou reseta a senha de) um usuário GERENTE para o primeiro login no sistema.
-- Só o perfil GERENTE pode cadastrar outros usuários pela aplicação, então esse é
-- o usuário "bootstrap" — depois de logado, use a tela de usuários para criar o resto.
--
-- Pré-requisito: a tabela `usuarios` já precisa existir (rode prisma/seed.sql primeiro,
-- se ainda não rodou — ver README.md).
--
-- Login:
--   email: admin@farmacia.com
--   senha: admin123
--
-- (o hash abaixo já é o resultado de bcrypt.hash("admin123", 10), o mesmo método
-- que src/modules/usuario/usuario.service.ts usa para cadastrar usuários)

INSERT INTO usuarios (nome, email, senha, ehAtivo, perfil, numeroCRF)
VALUES (
  'Administrador',
  'admin@farmacia.com',
  '$2b$10$hAdvKeWEFIAE9/ysYr3ntexod5oG1xaCyNlK9ON5FL0AcA0Mdqa9a',
  TRUE,
  'GERENTE',
  NULL
)
ON DUPLICATE KEY UPDATE
  senha   = VALUES(senha),
  ehAtivo = TRUE,
  perfil  = 'GERENTE';
