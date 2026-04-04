import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const productionEnvPath = path.join(cwd, ".env.production");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

if (existsSync(productionEnvPath) && (process.env.NODE_ENV === "production" || !existsSync(envPath))) {
  dotenv.config({ path: productionEnvPath, override: false });
}

const databaseUrl =
  (process.env.DATABASE_URL ?? "").trim().replace(/^['"]|['"]$/g, "");

const run = (command, envOverrides = {}) => {
  console.log(`\n> ${command}`);
  execSync(command, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
};

run("npx prisma generate", {
  DATABASE_URL:
    databaseUrl || "mysql://build:build@localhost:3306/hsc_exam_build",
});

if (!databaseUrl) {
  console.log(
    "\n⚠️  DATABASE_URL is not set. Skipping Prisma migrate/db push during install."
  );
  process.exit(0);
}

const strictDbSync = process.env.PRISMA_DEPLOY_STRICT === "true";

try {
  run("npx prisma migrate deploy", { DATABASE_URL: databaseUrl });
  console.log("\n✅ Prisma migrations applied successfully.");
} catch (error) {
  console.warn(
    "\n⚠️  prisma migrate deploy failed. Falling back to prisma db push..."
  );

  try {
    run("npx prisma db push", { DATABASE_URL: databaseUrl });
    console.log("\n✅ Prisma schema synced successfully with db push.");
  } catch (fallbackError) {
    console.warn(
      "\n⚠️  Database sync could not be completed automatically during install. " +
      "The application build will continue, but the migration state should be repaired manually on the server."
    );
    console.warn(
      "   Suggested manual fix: run `npx prisma migrate resolve --rolled-back add_accepting_applications_column` and then `npx prisma migrate deploy`."
    );

    if (strictDbSync) {
      throw fallbackError;
    }
  }
}
