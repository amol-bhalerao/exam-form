import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const productionEnvPath = path.join(cwd, ".env.production");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

if (existsSync(productionEnvPath) && (process.env.NODE_ENV === "production" || !process.env.DATABASE_URL)) {
  dotenv.config({ path: productionEnvPath, override: false });
}

const databaseUrl =
  (process.env.DATABASE_URL ?? "").trim().replace(/^['"]|['"]$/g, "") ||
  "mysql://root:@localhost:3306/hsc_exam_local";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
