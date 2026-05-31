import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SQL = path.resolve(__dirname, '../../../college-data.sql');

const ROW_RE =
  /\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'([^']*)'\s*,\s*(\d+)\s*\)/g;

function unescapeSql(value) {
  return String(value || '').replace(/''/g, "'");
}

export function parseCollegeRowsFromSql(content) {
  const rows = [];
  let match;
  while ((match = ROW_RE.exec(content)) !== null) {
    rows.push({
      collegeNo: unescapeSql(match[1]).trim(),
      udiseNo: unescapeSql(match[2]).trim(),
      name: unescapeSql(match[3]).trim(),
      status: match[4].trim() || 'PENDING',
      acceptingApplications: Number(match[5]) === 1
    });
  }
  return rows;
}

export async function importCollegesFromFile(filePath = DEFAULT_SQL) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`COLLEGE_SQL_NOT_FOUND:${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCollegeRowsFromSql(content);
  if (!rows.length) {
    throw new Error('NO_COLLEGE_ROWS_PARSED');
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const chunkSize = 40;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    for (const row of chunk) {
      const existing = await prisma.institute.findFirst({
        where: { collegeNo: row.collegeNo, udiseNo: row.udiseNo }
      });

      if (!existing) {
        await prisma.institute.create({
          data: {
            collegeNo: row.collegeNo,
            udiseNo: row.udiseNo,
            name: row.name,
            status: row.status,
            acceptingApplications: row.acceptingApplications
          }
        });
        created++;
        continue;
      }

      const changed =
        existing.name !== row.name ||
        existing.status !== row.status ||
        existing.acceptingApplications !== row.acceptingApplications;

      if (!changed) {
        skipped++;
        continue;
      }

      await prisma.institute.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          status: row.status,
          acceptingApplications: row.acceptingApplications
        }
      });
      updated++;
    }
  }

  return { filePath, totalParsed: rows.length, created, updated, skipped };
}
