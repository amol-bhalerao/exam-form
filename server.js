// Root entry point for Hostinger Node.js
// This file starts the backend Express server from the backend directory

import('./backend/src/server.js').catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
