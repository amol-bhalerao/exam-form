import { existsSync } from 'node:fs';
import path from 'node:path';
import * as mariadb from 'mariadb';
import dotenv from 'dotenv';

const cwd = process.cwd();
const envPath = path.join(cwd, '.env');
const productionEnvPath = path.join(cwd, '.env.production');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

if (existsSync(productionEnvPath) && (process.env.NODE_ENV === 'production' || !process.env.DATABASE_URL)) {
  dotenv.config({ path: productionEnvPath, override: false });
}

const rawUrl = (process.env.DATABASE_URL ?? 'mysql://root:@localhost:3306/hsc_exam_local')
  .trim()
  .replace(/^['"]|['"]$/g, '');
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

async function hasTable(table) {
  const rows = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [database, table]
  );
  return Number(rows[0].c) > 0;
}

async function hasIndex(table, indexName) {
  const rows = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [database, table, indexName]
  );
  return Number(rows[0].c) > 0;
}

async function hasUniqueIndexOnColumn(table, column) {
  const rows = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND NON_UNIQUE = 0`,
    [database, table, column]
  );
  return Number(rows[0].c) > 0;
}

async function addColumnIfMissing(table, column, sql) {
  if (await hasColumn(table, column)) return;
  await pool.query(sql);
  console.log(`Added ${table}.${column}`);
}

async function addUniqueIndexIfMissing(table, indexName, column, sql) {
  if ((await hasIndex(table, indexName)) || (await hasUniqueIndexOnColumn(table, column))) return;
  await pool.query(sql);
  console.log(`Added index ${indexName}`);
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

  await addColumnIfMissing(
    'streams',
    'shortCode',
    'ALTER TABLE streams ADD COLUMN shortCode VARCHAR(3) NULL AFTER name'
  );
  await addUniqueIndexIfMissing(
    'streams',
    'streams_shortCode_key',
    'shortCode',
    'CREATE UNIQUE INDEX streams_shortCode_key ON streams (shortCode)'
  );

  await addColumnIfMissing(
    'exams',
    'examCode',
    'ALTER TABLE exams ADD COLUMN examCode VARCHAR(10) NULL AFTER streamId'
  );
  await addUniqueIndexIfMissing(
    'exams',
    'exams_examCode_key',
    'examCode',
    'CREATE UNIQUE INDEX exams_examCode_key ON exams (examCode)'
  );

  await addColumnIfMissing(
    'exam_applications',
    'instituteSequenceNumber',
    'ALTER TABLE exam_applications ADD COLUMN instituteSequenceNumber VARCHAR(50) NULL AFTER applicationNo'
  );
  await addColumnIfMissing(
    'exam_applications',
    'boardSequenceNumber',
    'ALTER TABLE exam_applications ADD COLUMN boardSequenceNumber VARCHAR(50) NULL AFTER instituteSequenceNumber'
  );
  await addColumnIfMissing(
    'exam_applications',
    'applSrNo',
    'ALTER TABLE exam_applications ADD COLUMN applSrNo VARCHAR(50) NULL AFTER studentSaralId'
  );
  await addUniqueIndexIfMissing(
    'exam_applications',
    'exam_applications_instituteSequenceNumber_key',
    'instituteSequenceNumber',
    'CREATE UNIQUE INDEX exam_applications_instituteSequenceNumber_key ON exam_applications (instituteSequenceNumber)'
  );
  await addUniqueIndexIfMissing(
    'exam_applications',
    'exam_applications_boardSequenceNumber_key',
    'boardSequenceNumber',
    'CREATE UNIQUE INDEX exam_applications_boardSequenceNumber_key ON exam_applications (boardSequenceNumber)'
  );

  if (!(await hasTable('exam_form_sequences'))) {
    await pool.query(`
      CREATE TABLE exam_form_sequences (
        id INT NOT NULL AUTO_INCREMENT,
        level ENUM('INSTITUTE','BOARD') NOT NULL DEFAULT 'INSTITUTE',
        examId INT NOT NULL,
        streamId INT NOT NULL,
        instituteId INT NULL,
        currentSequence INT NOT NULL DEFAULT 0,
        totalApplications INT NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT true,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY exam_form_sequences_level_examId_streamId_instituteId_key (level, examId, streamId, instituteId),
        KEY exam_form_sequences_level_examId_streamId_idx (level, examId, streamId),
        KEY exam_form_sequences_examId_streamId_instituteId_idx (examId, streamId, instituteId),
        KEY exam_form_sequences_isActive_idx (isActive),
        CONSTRAINT exam_form_sequences_examId_fkey
          FOREIGN KEY (examId) REFERENCES exams(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT exam_form_sequences_streamId_fkey
          FOREIGN KEY (streamId) REFERENCES streams(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT exam_form_sequences_instituteId_fkey
          FOREIGN KEY (instituteId) REFERENCES institutes(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Created exam_form_sequences');
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
