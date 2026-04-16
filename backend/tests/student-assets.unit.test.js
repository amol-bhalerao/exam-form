import { beforeAll, describe, expect, it } from 'vitest';

const SAMPLE_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6p9vQAAAAASUVORK5CYII=';

let saveStudentAsset;
let getStudentAssetUrl;
let removeStudentAsset;

describe('student-assets utility', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
    process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

    const module = await import('../src/utils/student-assets.js');
    saveStudentAsset = module.saveStudentAsset;
    getStudentAssetUrl = module.getStudentAssetUrl;
    removeStudentAsset = module.removeStudentAsset;
  });

  it('saves, resolves, and removes a student photo asset', async () => {
    const studentId = Date.now();

    const saved = await saveStudentAsset(studentId, 'photo', SAMPLE_PNG_DATA_URL);
    expect(saved.url).toContain(`/uploads/students/student-${studentId}-photo`);

    const resolved = await getStudentAssetUrl(studentId, 'photo');
    expect(resolved).toContain(`/uploads/students/student-${studentId}-photo`);

    await removeStudentAsset(studentId, 'photo');
    const afterDelete = await getStudentAssetUrl(studentId, 'photo');
    expect(afterDelete).toBeNull();
  });

  it('rejects invalid asset payloads', async () => {
    await expect(saveStudentAsset(Date.now() + 1000, 'signature', 'bad-data-url')).rejects.toThrow('INVALID_IMAGE_FORMAT');
  });
});
