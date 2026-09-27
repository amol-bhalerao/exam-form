// Serves the built Angular app (frontend/dist) with SPA fallback for E2E runs.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend/dist/exam-form');
const dist = fs.existsSync(path.join(root, 'browser', 'index.html')) ? path.join(root, 'browser') : root;
const port = Number(process.env.E2E_FRONTEND_PORT || 4200);
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error(`No build found in ${dist}. Run: cd frontend && npx ng build --configuration development`);
  process.exit(1);
}

http.createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`E2E frontend on http://localhost:${port}`));
