import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// O `dev:all` sobe a API a partir de `frontend/`, então `dotenv/config`
// não acharia o `.env` da raiz. Carrega sempre o arquivo do projeto.
config({ path: resolve(__dirname, "../../../.env") });

function connectionUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida. Verifique o arquivo .env na raiz do projeto.");
  }
  return url.replace("@localhost:", "@127.0.0.1:");
}

const adapter = new PrismaMariaDb(connectionUrl());
const prisma = new PrismaClient({ adapter });

export { prisma };
