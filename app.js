// Explicitly set environment variables BEFORE dotenv
process.env.JWT_ACCESS_SECRET = "JayaSecretKey_@1989_HSCExam";
process.env.JWT_REFRESH_SECRET = "JayaRefreshSecret_@1989_HSCExam";

// Now load dotenv 
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");
config({ path: envPath, override: true });

console.error(`[STARTUP] JWT_ACCESS_SECRET="${process.env.JWT_ACCESS_SECRET}"`);
console.error(`[STARTUP] JWT_REFRESH_SECRET="${process.env.JWT_REFRESH_SECRET}"`);

// Now import and start the app
import("./dist/server.js").catch(err => {
  console.error("[ERROR] Failed to start server:", err.message);
  process.exit(1);
});
