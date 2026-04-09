import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { env } from '../env.js';

const STUDENT_ASSET_DIR = fileURLToPath(new URL('../../uploads/students/', import.meta.url));
const STUDENT_ASSET_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png'];
export const MAX_STUDENT_ASSET_BYTES = 50 * 1024;

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/$/, '');
}

function mimeToExtension(mimeType) {
  const normalized = String(mimeType || '').toLowerCase();
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  return 'webp';
}

function buildAssetUrl(fileName) {
  const baseUrl = normalizeBaseUrl(env.BACKEND_URL || '');
  return `${baseUrl}/uploads/students/${fileName}?v=${Date.now()}`;
}

async function ensureStudentAssetDir() {
  await fs.mkdir(STUDENT_ASSET_DIR, { recursive: true });
}

async function resolveStudentAssetFile(studentId, type) {
  for (const ext of STUDENT_ASSET_EXTENSIONS) {
    const fileName = `student-${studentId}-${type}.${ext}`;
    const filePath = path.join(STUDENT_ASSET_DIR, fileName);
    try {
      await fs.access(filePath);
      return { fileName, filePath };
    } catch {
      // continue to next extension
    }
  }
  return null;
}

function parseStudentDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(?:webp|png|jpeg|jpg));base64,(.+)$/i);
  if (!match) {
    const error = new Error('INVALID_IMAGE_FORMAT');
    error.status = 400;
    throw error;
  }

  const mimeType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');

  if (!buffer?.length) {
    const error = new Error('EMPTY_IMAGE_DATA');
    error.status = 400;
    throw error;
  }

  if (buffer.length > MAX_STUDENT_ASSET_BYTES) {
    const error = new Error('IMAGE_TOO_LARGE');
    error.status = 413;
    throw error;
  }

  return { buffer, mimeType };
}

export async function getStudentAssetUrl(studentId, type) {
  if (!studentId || !type) return null;
  const existing = await resolveStudentAssetFile(studentId, type);
  return existing ? buildAssetUrl(existing.fileName) : null;
}

export async function saveStudentAsset(studentId, type, dataUrl) {
  if (!studentId || !type) {
    const error = new Error('INVALID_ASSET_REQUEST');
    error.status = 400;
    throw error;
  }

  const { buffer, mimeType } = parseStudentDataUrl(dataUrl);
  const extension = mimeToExtension(mimeType);
  const fileName = `student-${studentId}-${type}.${extension}`;
  const filePath = path.join(STUDENT_ASSET_DIR, fileName);

  await ensureStudentAssetDir();
  await removeStudentAsset(studentId, type);
  await fs.writeFile(filePath, buffer);

  return {
    url: buildAssetUrl(fileName),
    bytes: buffer.length,
    mimeType
  };
}

export async function removeStudentAsset(studentId, type) {
  const existing = await resolveStudentAssetFile(studentId, type);
  if (!existing) return false;
  await fs.unlink(existing.filePath).catch(() => {});
  return true;
}

export async function attachStudentAssets(student) {
  if (!student?.id) return student;
  return {
    ...student,
    photoUrl: await getStudentAssetUrl(student.id, 'photo'),
    signatureUrl: await getStudentAssetUrl(student.id, 'signature')
  };
}
