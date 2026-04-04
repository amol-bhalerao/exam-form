import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = (process.env.DATABASE_URL ?? "").trim().replace(/^['"]|['"]$/g, "");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set for Prisma CLI.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
