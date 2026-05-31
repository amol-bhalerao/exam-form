import "dotenv/config";
import { defineConfig } from "prisma/config";

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
