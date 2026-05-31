import 'dotenv/config';
import * as mariadb from 'mariadb';

const rawUrl = (process.env.DATABASE_URL ?? 'mysql://root:@localhost:3306/hsc_exam_local').trim();
const url = new URL(rawUrl.replace(/^mysql:/, 'mariadb:'));
const database = url.pathname.replace(/^\//, '');

const pool = mariadb.createPool({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database
});

async function hasColumn(table, column) {
  const rows = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, table, column]
  );
  return Number(rows[0].c) > 0;
}

async function main() {
  const examStreamCol = await pool.query(
    `SELECT IS_NULLABLE AS nullable FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'exams' AND COLUMN_NAME = 'streamId'`,
    [database]
  );
  if (examStreamCol[0]?.nullable === 'NO') {
    await pool.query('ALTER TABLE exams MODIFY COLUMN streamId INT NULL');
    console.log('exams.streamId is now nullable (all-stream exams supported)');
  }

  if (!(await hasColumn('streams', 'shortCode'))) {
    await pool.query('ALTER TABLE streams ADD COLUMN shortCode VARCHAR(3) NULL UNIQUE AFTER name');
    console.log('Added streams.shortCode');
  }

  await pool.query(
    "UPDATE streams SET shortCode = 'SCI' WHERE (name LIKE '%Science%' OR name = 'SCIENCE') AND (shortCode IS NULL OR shortCode = '')"
  );
  await pool.query(
    "UPDATE streams SET shortCode = 'ART' WHERE (name LIKE '%Arts%' OR name = 'ARTS') AND (shortCode IS NULL OR shortCode = '')"
  );
  await pool.query(
    "UPDATE streams SET shortCode = 'COM' WHERE (name LIKE '%Commerce%' OR name = 'COMMERCE') AND (shortCode IS NULL OR shortCode = '')"
  );
  await pool.query(
    "UPDATE streams SET shortCode = 'VOC' WHERE (name LIKE '%Vocational%' OR name LIKE '%HSC.VOC%') AND (shortCode IS NULL OR shortCode = '')"
  );

  console.log('DB column sync done on', database);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
