import fs from 'fs';
import path from 'path';

const examRoot = path.join('frontend', 'dist', 'exam-form');
const browserRoot = path.join(examRoot, 'browser');

if (!fs.existsSync(examRoot)) {
  console.warn(`Warning: frontend output not found at ${examRoot}`);
  process.exit(0);
}

const publishRoot = fs.existsSync(path.join(browserRoot, 'index.html')) ? browserRoot : examRoot;
const distRoot = 'dist';
const distExamDest = path.join(distRoot, 'exam-form');
const publicHtmlDest = 'public_html';

fs.rmSync(distRoot, { recursive: true, force: true });
fs.mkdirSync(distRoot, { recursive: true });
fs.cpSync(publishRoot, distRoot, { recursive: true });
fs.cpSync(examRoot, distExamDest, { recursive: true });

fs.rmSync(publicHtmlDest, { recursive: true, force: true });
fs.cpSync(publishRoot, publicHtmlDest, { recursive: true });

console.log(`Prepared deployment output at ${distRoot}`);
console.log(`Prepared compatibility output at ${distExamDest}`);
console.log(`Prepared Hostinger output at ${publicHtmlDest}`);
