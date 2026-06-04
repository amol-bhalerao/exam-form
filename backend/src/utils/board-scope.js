import { prisma } from '../prisma.js';

export const DEFAULT_BOARD_TYPE = 'HSC';
export const BOARD_TYPES = ['HSC', 'SSC'];

const columnCache = new Map();

export function normalizeBoardType(value, fallback = DEFAULT_BOARD_TYPE) {
  const normalized = String(value || '').trim().toUpperCase();
  return BOARD_TYPES.includes(normalized) ? normalized : fallback;
}

async function hasColumn(tableName, columnName) {
  const key = `${tableName}.${columnName}`;
  if (columnCache.has(key)) return columnCache.get(key);

  try {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      tableName,
      columnName
    );
    const count = Number(rows?.[0]?.count ?? 0);
    const exists = count > 0;
    columnCache.set(key, exists);
    return exists;
  } catch {
    columnCache.set(key, false);
    return false;
  }
}

export async function isBoardScopeEnabled() {
  const [exams, institutes, users] = await Promise.all([
    hasColumn('exams', 'boardType'),
    hasColumn('institutes', 'boardType'),
    hasColumn('users', 'boardType')
  ]);
  return exams && institutes && users;
}

export async function getUserBoardType(userId) {
  if (!userId || !(await hasColumn('users', 'boardType'))) return DEFAULT_BOARD_TYPE;
  const rows = await prisma.$queryRawUnsafe('SELECT `boardType` FROM `users` WHERE `id` = ? LIMIT 1', Number(userId));
  return normalizeBoardType(rows?.[0]?.boardType);
}

export async function getInstituteBoardType(instituteId) {
  if (!instituteId || !(await hasColumn('institutes', 'boardType'))) return DEFAULT_BOARD_TYPE;
  const rows = await prisma.$queryRawUnsafe('SELECT `boardType` FROM `institutes` WHERE `id` = ? LIMIT 1', Number(instituteId));
  return normalizeBoardType(rows?.[0]?.boardType);
}

export async function getAuthBoardType(auth) {
  if (!auth) return DEFAULT_BOARD_TYPE;
  if (auth.boardType) return normalizeBoardType(auth.boardType);
  if (auth.role === 'BOARD') return getUserBoardType(auth.userId);
  if (auth.role === 'INSTITUTE') return getInstituteBoardType(auth.instituteId);
  if (auth.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: auth.userId },
          { managerUserId: auth.userId }
        ]
      },
      select: { instituteId: true }
    });
    return getInstituteBoardType(student?.instituteId);
  }
  return DEFAULT_BOARD_TYPE;
}

export async function getScopedExamIds(auth) {
  if (!(await hasColumn('exams', 'boardType'))) return null;
  if (auth?.role === 'SUPER_ADMIN') return null;

  const boardType = await getAuthBoardType(auth);
  const rows = await prisma.$queryRawUnsafe('SELECT `id` FROM `exams` WHERE `boardType` = ?', boardType);
  return rows.map((row) => Number(row.id)).filter(Number.isFinite);
}

export async function applyExamBoardScope(where, auth) {
  const scopedExamIds = await getScopedExamIds(auth);
  if (!Array.isArray(scopedExamIds)) return where;

  const scopedIdFilter = { in: scopedExamIds };
  return {
    ...where,
    id: where.id ? { ...where.id, ...scopedIdFilter } : scopedIdFilter
  };
}

export async function applyApplicationBoardScope(where, auth) {
  const scopedExamIds = await getScopedExamIds(auth);
  if (!Array.isArray(scopedExamIds)) return where;

  if (where.examId && typeof where.examId === 'number') {
    return scopedExamIds.includes(where.examId) ? where : { ...where, examId: { in: [] } };
  }

  return {
    ...where,
    examId: where.examId ? { ...where.examId, in: scopedExamIds } : { in: scopedExamIds }
  };
}

export async function stampExamBoardType(examId, boardType) {
  if (!examId || !(await hasColumn('exams', 'boardType'))) return;
  await prisma.$executeRawUnsafe('UPDATE `exams` SET `boardType` = ? WHERE `id` = ?', normalizeBoardType(boardType), Number(examId));
}

export async function enrichUsersWithBoardType(users = []) {
  if (!users.length || !(await hasColumn('users', 'boardType'))) return users;
  const ids = users.map((user) => Number(user.id)).filter(Number.isFinite);
  if (!ids.length) return users;
  const placeholders = ids.map(() => '?').join(',');
  const rows = await prisma.$queryRawUnsafe(`SELECT id, boardType FROM users WHERE id IN (${placeholders})`, ...ids);
  const boardByUserId = new Map(rows.map((row) => [Number(row.id), normalizeBoardType(row.boardType)]));
  return users.map((user) => ({ ...user, boardType: boardByUserId.get(Number(user.id)) || DEFAULT_BOARD_TYPE }));
}

export async function setUserBoardType(userId, boardType) {
  if (!userId || !(await hasColumn('users', 'boardType'))) return;
  await prisma.$executeRawUnsafe('UPDATE `users` SET `boardType` = ? WHERE `id` = ?', normalizeBoardType(boardType), Number(userId));
}

export async function enrichApplicationBoardTypes(application) {
  if (!application || !(await isBoardScopeEnabled())) return application;

  const [examRows, instituteRows] = await Promise.all([
    application.examId
      ? prisma.$queryRawUnsafe('SELECT `id`, `boardType` FROM `exams` WHERE `id` = ? LIMIT 1', Number(application.examId))
      : [],
    application.instituteId
      ? prisma.$queryRawUnsafe('SELECT `id`, `boardType` FROM `institutes` WHERE `id` = ? LIMIT 1', Number(application.instituteId))
      : []
  ]);

  const examBoardType = normalizeBoardType(examRows?.[0]?.boardType);
  const instituteBoardType = normalizeBoardType(instituteRows?.[0]?.boardType);

  return {
    ...application,
    exam: application.exam ? { ...application.exam, boardType: examBoardType } : application.exam,
    institute: application.institute ? { ...application.institute, boardType: instituteBoardType } : application.institute
  };
}

export async function enrichInstitutesWithBoardType(institutes = []) {
  if (!institutes.length || !(await hasColumn('institutes', 'boardType'))) return institutes;
  const ids = institutes.map((institute) => Number(institute.id)).filter(Number.isFinite);
  if (!ids.length) return institutes;
  const placeholders = ids.map(() => '?').join(',');
  const rows = await prisma.$queryRawUnsafe(`SELECT id, boardType FROM institutes WHERE id IN (${placeholders})`, ...ids);
  const boardByInstituteId = new Map(rows.map((row) => [Number(row.id), normalizeBoardType(row.boardType)]));
  return institutes.map((institute) => ({
    ...institute,
    boardType: boardByInstituteId.get(Number(institute.id)) || DEFAULT_BOARD_TYPE
  }));
}
