import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Driver adapter para MySQL — necessário no Prisma 7+.
 * Lê as credenciais das variáveis de ambiente (veja .env.example).
 */
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "farmacia_bairro_saude",
});

const prisma = new PrismaClient({ adapter });

export { prisma };
