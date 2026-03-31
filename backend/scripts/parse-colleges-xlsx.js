import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelFilePath = path.join(__dirname, '../../HSC COLLEGE LIST 2025 Cha Sambhaji Nagar.xlsx');

console.log('Processing Excel file for college data...\n');

// Read the Excel file
const workbook = XLSX.readFile(excelFilePath);
console.log('Processing sheets:', workbook.SheetNames);

const institutes = new Map(); // collegeNo -> { name, udiseNo, streams: Set<streamName> }
const streams = new Set();

// Valid stream names to filter
const validStreams = ['SCIENCE', 'ARTS', 'COMMERCE', 'HSC.VOC'];

// Process each sheet
for (const sheetName of workbook.SheetNames) {
  console.log(`\nProcessing sheet: ${sheetName}`);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  let currentCollege = null;
  let currentUdise = null;
  let currentName = null;

  // Parse data
  for (let i = 2; i < data.length; i++) { // Start from row 2 (skip header rows)
    const row = data[i];
    
    if (!row || row.length < 3) continue;
    
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    
    // Check if this row has college info (col0 has format like "56.01.001\n27191109505")
    const collegeMatch = col0.match(/^([\d.]+)\s*\n?\s*([\d]+)/);
    
    if (collegeMatch) {
      // New college entry
      currentCollege = collegeMatch[1].trim();
      currentUdise = collegeMatch[2].trim();
      currentName = col1;
      
      if (currentCollege && currentName && currentUdise) {
        if (!institutes.has(currentCollege)) {
          institutes.set(currentCollege, {
            collegeNo: currentCollege,
            udiseNo: currentUdise,
            name: currentName,
            streams: new Set()
          });
        }
        console.log(`  Found college: ${currentCollege} | ${currentUdise} | ${currentName.substring(0, 50)}`);
      }
    } else if (currentCollege && col2 && validStreams.includes(col2.toUpperCase()) && col2.toUpperCase() !== 'TOTAL') {
      // Add stream to current college
      const streamName = col2.toUpperCase();
      streams.add(streamName);
      
      const inst = institutes.get(currentCollege);
      if (inst) {
        inst.streams.add(streamName);
      }
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total unique colleges: ${institutes.size}`);
console.log(`Total unique streams: ${streams.size}`);
console.log(`Streams found: ${Array.from(streams).sort().join(', ')}`);

// Display sample colleges
console.log(`\nSample colleges:`);
Array.from(institutes.values())
  .slice(0, 5)
  .forEach(inst => {
    console.log(`  ${inst.collegeNo} (${inst.udiseNo}): ${inst.name.substring(0, 50)} [${Array.from(inst.streams).join(', ')}]`);
  });

// Generate SQL
let sql = '-- Generated SQL for HSC COLLEGE LIST 2025 (Cha Sambhaji Nagar)\n';
sql += '-- ' + new Date().toISOString() + '\n';
sql += '-- Processed from: HSC COLLEGE LIST 2025 Cha Sambhaji Nagar.xlsx\n';
sql += '-- Total colleges: ' + institutes.size + '\n';
sql += '-- All institutes are set to PENDING status\n';
sql += '-- All institutes can accept applications (acceptingApplications = 1)\n\n';

// Insert streams if they don't exist
sql += '-- Insert Streams\n';
sql += 'INSERT IGNORE INTO streams (name) VALUES\n';
const streamArray = Array.from(streams).sort();
sql += streamArray.map(s => `('${s.replace(/'/g, "''")}')`).join(',\n') + ';\n\n';

// Insert institutes
sql += '-- Insert Institutes (' + institutes.size + ' total)\n';
sql += 'INSERT INTO institutes (collegeNo, udiseNo, name, status, acceptingApplications) VALUES\n';
const instituteArray = Array.from(institutes.values()).sort((a, b) => a.collegeNo.localeCompare(b.collegeNo));
const instRows = instituteArray.map((inst, idx) => {
  return `('${inst.collegeNo.replace(/'/g, "''")}', '${inst.udiseNo.replace(/'/g, "''")}', '${inst.name.replace(/'/g, "''")}', 'PENDING', 1)`;
});
sql += instRows.join(',\n') + ';\n\n';

// Generate the SQL file
const sqlFilePath = path.join(__dirname, '../../college-data.sql');
fs.writeFileSync(sqlFilePath, sql);
console.log(`\n✓ SQL file generated successfully: ${sqlFilePath}`);
console.log(`File size: ${fs.statSync(sqlFilePath).size} bytes`);
console.log(`\nTo import into database, run:`);
console.log(`  mysql -u root hsc_exam_dev < college-data.sql`);
