import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// O `dev:all` sobe a API a partir de `frontend/`, então `dotenv/config`
// não acharia o `.env` da raiz. Carrega sempre o arquivo do projeto.
config({ path: resolve(__dirname, "../../../.env") });

function connectionConfig() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida. Verifique o arquivo .env na raiz do projeto.");
  }

  // No Windows, `localhost` pode resolver para IPv6; o WAMP escuta em IPv4.
  const parsed = new URL(url.replace("@localhost:", "@127.0.0.1:"));

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    // MySQL 8 (WAMP) usa caching_sha2_password. Sem isso o driver MariaDB
    // espera a chave RSA e estoura pool timeout (erro 45028).
    allowPublicKeyRetrieval: true,
    ssl: false,
  };
}

const adapter = new PrismaMariaDb(connectionConfig());
const prisma = new PrismaClient({ adapter });

export { prisma };
