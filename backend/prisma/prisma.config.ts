import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  (process.env.DATABASE_URL ?? "").trim().replace(/^['"]|['"]$/g, "") ||
  "mysql://build:build@localhost:3306/hsc_exam_build";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
