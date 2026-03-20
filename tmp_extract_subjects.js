const xlsx = require('xlsx');
const wb = xlsx.readFile('requirement docs/HSC EXAM SUBJEC LIS.xlsx');
console.log('sheets', wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log('\n---', name, '---');
  for (let i = 0; i < Math.min(30, rows.length); i++) {
    console.log(i + 1, rows[i]);
  }
}
