const path = require("node:path");

process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.chdir(path.join(__dirname, "backend"));

import("./backend/src/server.js").catch((error) => {
  console.error("Failed to start backend server from root entry:", error);
  process.exit(1);
});
