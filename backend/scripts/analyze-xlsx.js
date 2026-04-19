import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelFilePath = path.join(__dirname, '../../HSC COLLEGE LIST 2025 Cha Sambhaji Nagar.xlsx');

console.log('Analyzing Excel file structure...\n');

// Read the Excel file
const workbook = XLSX.readFile(excelFilePath);
console.log('Workbook sheets:', workbook.SheetNames);

// Analyze first sheet only
const sheetName = workbook.SheetNames[0];
console.log(`\nAnalyzing sheet: ${sheetName}`);

const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`Total rows: ${data.length}`);

// Show first 20 rows with all columns
console.log('\nFirst 20 rows (all columns):');
for (let i = 0; i < Math.min(20, data.length); i++) {
  const row = data[i];
  console.log(`Row ${i}: [${row.map((v, idx) => `${idx}:${String(v).substring(0, 30)}`).join(' | ')}]`);
}

// Show header row info
if (data.length > 0) {
  console.log(`\nHeader row (${data[0].length} columns):`);
  data[0].forEach((col, idx) => {
    console.log(`  [${idx}] ${String(col).substring(0, 50)}`);
  });
}

// Look for common stream names
const allCells = [];
for (let i = 0; i < Math.min(100, data.length); i++) {
  const row = data[i];
  for (let j = 0; j < row.length; j++) {
    const cell = String(row[j]).trim().toUpperCase();
    if (cell && cell.length > 0 && cell.length < 50) {
      allCells.push(cell);
    }
  }
}

console.log(`\nUnique cell values in first 100 rows:`);
const unique = [...new Set(allCells)].sort();
const streamKeywords = unique.filter(v => 
  /SCIENCE|ARTS|COMMERCE|HSC|SSC|XI|XII|STREAM|COURSE|PROGRAMME/.test(v)
);

if (streamKeywords.length > 0) {
  console.log('Potential stream/course identifiers:');
  streamKeywords.forEach(s => console.log(`  - ${s}`));
} else {
  console.log('Sample unique values (first 50):');
  unique.slice(0, 50).forEach(s => console.log(`  - ${s}`));
}
