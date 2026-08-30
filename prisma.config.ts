import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // No Windows, `localhost` resolve para IPv6 (::1) e o MySQL escuta em IPv4.
    url: env("DATABASE_URL").replace("@localhost:", "@127.0.0.1:"),
  },
});
