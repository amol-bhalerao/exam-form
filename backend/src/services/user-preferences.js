/**
 * Per-user UI preferences (currently: interface language).
 *
 * Stored in the `user_preferences` table (created by scripts/sync-db-columns.mjs
 * and modelled in prisma/schema.prisma as UserPreference). All access goes
 * through raw SQL wrapped in try/catch so that a missing table can never break
 * login or any other request — the app simply falls back to the role default.
 */

export const SUPPORTED_LANGUAGES = ['mr', 'en', 'hi'];

export function normalizeLanguage(value) {
  const lang = String(value ?? '').trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : null;
}

/** Students default to Marathi; staff (institute, board, admin) default to English. */
export function defaultLanguageForRole(role) {
  return String(role || '').toUpperCase() === 'STUDENT' ? 'mr' : 'en';
}

export async function getSavedLanguage(client, userId) {
  if (!userId) return null;
  try {
    const rows = await client.$queryRaw`SELECT language FROM user_preferences WHERE userId = ${Number(userId)} LIMIT 1`;
    return normalizeLanguage(rows?.[0]?.language);
  } catch {
    return null;
  }
}

export async function saveLanguage(client, userId, language) {
  const lang = normalizeLanguage(language);
  if (!lang) throw Object.assign(new Error('UNSUPPORTED_LANGUAGE'), { status: 400 });
  await client.$executeRaw`
    INSERT INTO user_preferences (userId, language, updatedAt)
    VALUES (${Number(userId)}, ${lang}, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE language = VALUES(language), updatedAt = CURRENT_TIMESTAMP(3)`;
  return lang;
}

/**
 * Fields added to every auth/me response so the client can restore the
 * user's language immediately after login.
 */
export async function languageFieldsFor(client, userId, role) {
  const saved = await getSavedLanguage(client, userId);
  return {
    preferredLanguage: saved,
    defaultLanguage: defaultLanguageForRole(role)
  };
}
