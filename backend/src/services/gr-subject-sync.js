/**
 * Idempotent master-data sync for the 2019 GR subject scheme.
 *
 *  1. Inserts any GR subject whose board code is missing from `subjects`
 *     (existing rows are never renamed or deleted).
 *  2. For each stream covered by the GR, fills `stream_subjects` with the
 *     scheme's subjects — but ONLY when that stream has no mappings yet, so
 *     mappings already curated by the board are left untouched.
 *  3. Creates the `user_preferences` table used for language preference.
 *
 * `query(sql, params)` must return an array of row objects (mariadb pool
 * compatible). Called from scripts/sync-db-columns.mjs on every deploy.
 */
import {
  SUBJECT_CATALOGUE,
  STREAM_SCHEME,
  COMPULSORY_CODES,
  resolveSchemeStream
} from './subject-scheme.js';

const CATEGORY_BY_KIND = {
  COMPULSORY: 'Compulsory',
  MIL: 'Language',
  MFL: 'Language',
  CLASSICAL: 'Language',
  IT: 'Optional Subjects',
  ELECTIVE: 'Optional Subjects',
  FOUNDATION: 'Optional Subjects',
  BIFOCAL: 'Bifocal Subjects',
  VOCATIONAL: 'Vocational Subjects'
};

export function schemeCodesForStream(streamKey) {
  const scheme = STREAM_SCHEME[streamKey];
  if (!scheme) return [];
  const codes = new Set(COMPULSORY_CODES);
  for (const list of [scheme.groupAChoice, scheme.groupB, scheme.groupC, scheme.optional]) {
    for (const code of list || []) codes.add(code);
  }
  if (scheme.foundation) codes.add(scheme.foundation);
  return [...codes];
}

export async function ensureUserPreferencesTable(query) {
  await query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      userId INT NOT NULL,
      language VARCHAR(5) NOT NULL DEFAULT 'mr',
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (userId)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function syncGrSubjects(query, log = console.log) {
  const existing = await query('SELECT id, code FROM subjects');
  const idByCode = new Map();
  for (const row of existing) {
    const code = String(row.code ?? '').trim();
    if (code && !idByCode.has(code)) idByCode.set(code, Number(row.id));
  }

  let inserted = 0;
  for (const subject of SUBJECT_CATALOGUE) {
    if (idByCode.has(subject.code)) continue;
    await query('INSERT INTO subjects (name, code, category) VALUES (?, ?, ?)', [
      subject.name.en,
      subject.code,
      CATEGORY_BY_KIND[subject.kind] || 'Optional Subjects'
    ]);
    inserted += 1;
  }
  if (inserted) {
    const refreshed = await query('SELECT id, code FROM subjects');
    for (const row of refreshed) {
      const code = String(row.code ?? '').trim();
      if (code && !idByCode.has(code)) idByCode.set(code, Number(row.id));
    }
    log(`GR subjects: inserted ${inserted} missing subject(s)`);
  }

  const streams = await query('SELECT id, name, shortCode FROM streams');
  const mapped = [];
  for (const stream of streams) {
    const key = resolveSchemeStream(stream);
    if (!key) continue;
    const countRows = await query('SELECT COUNT(*) AS c FROM stream_subjects WHERE streamId = ?', [stream.id]);
    if (Number(countRows?.[0]?.c ?? 0) > 0) continue;

    const subjectIds = schemeCodesForStream(key).map((code) => idByCode.get(code)).filter(Boolean);
    for (const subjectId of subjectIds) {
      await query('INSERT INTO stream_subjects (streamId, subjectId) VALUES (?, ?)', [stream.id, subjectId]);
    }
    mapped.push(`${stream.name} (${subjectIds.length})`);
  }
  if (mapped.length) log(`GR subjects: mapped streams ${mapped.join(', ')}`);

  return { inserted, mappedStreams: mapped };
}
