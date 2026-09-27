// Run with: npm run test:scheme   (uses the built-in node:test runner, no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSubjectSelection,
  resolveSchemeStream,
  describeScheme,
  paperCount,
  SUBJECT_CATALOGUE,
  checkSubjectScheme
} from '../../src/services/subject-scheme.js';

const codes = (r) => r.errors.map((e) => e.code);

test('resolves stream rows, names and student stream codes', () => {
  assert.equal(resolveSchemeStream({ name: 'Science', shortCode: 'SCI' }), 'SCIENCE');
  assert.equal(resolveSchemeStream({ name: 'Arts', shortCode: 'ART' }), 'ARTS');
  assert.equal(resolveSchemeStream({ name: 'Commerce', shortCode: 'COM' }), 'COMMERCE');
  assert.equal(resolveSchemeStream({ name: 'HSC Vocational', shortCode: 'VOC' }), 'VOCATIONAL');
  assert.equal(resolveSchemeStream({ name: 'Technology Science', shortCode: 'TEC' }), null);
  assert.equal(resolveSchemeStream('1'), 'SCIENCE');
  assert.equal(resolveSchemeStream('2'), 'ARTS');
  assert.equal(resolveSchemeStream('3'), 'COMMERCE');
  assert.equal(resolveSchemeStream('4'), 'VOCATIONAL');
});

test('catalogue has unique codes', () => {
  const all = SUBJECT_CATALOGUE.map((s) => s.code);
  assert.equal(new Set(all).size, all.length);
});

test('valid Science PCMB with Marathi', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '2', '40', '54', '55', '56', '31', '30'] });
  assert.deepEqual(codes(r), []);
  assert.equal(r.ok, true);
  assert.equal(r.summary.papers, 8);
  assert.deepEqual(r.summary.aChoice, ['2']);
  assert.equal(r.summary.groupB.length, 4);
});

test('valid Science PCM + Group C (Geography)', () => {
  const r = validateSubjectSelection({ stream: 'Science', subjects: ['1', '4', '40', '54', '55', '39', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.summary.groupC, ['39']);
});

test('Science with IT in place of language', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '97', '40', '54', '55', '56', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.summary.aChoice, ['97']);
});

test('Science with language and IT in Group B instead of Biology', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '2', '40', '54', '55', '97', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('missing compulsory HPE is reported', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '2', '40', '54', '55', '56', '31'] });
  assert.ok(codes(r).includes('COMPULSORY_MISSING'));
  assert.equal(r.errors.find((e) => e.code === 'COMPULSORY_MISSING').params.subjectCode, '30');
});

test('only two Group B subjects is rejected', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '2', '54', '55', '39', '46', '31', '30'] });
  assert.ok(codes(r).includes('GROUP_B_MIN'));
});

test('too many subjects is rejected', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '2', '40', '54', '55', '56', '39', '31', '30'] });
  assert.ok(codes(r).includes('GROUP_BC_TOTAL'));
  assert.equal(r.ok, false);
});

test('subject from another stream is flagged', () => {
  // Secretarial Practice (52) is a Commerce Group B subject only
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '2', '40', '54', '55', '52', '31', '30'] });
  assert.ok(codes(r).includes('NOT_ALLOWED_FOR_STREAM'));
});

test('valid Commerce with Maths', () => {
  const r = validateSubjectSelection({ stream: 'COM', subjects: ['1', '2', '88', '49', '50', '51', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('valid Commerce with Group C Psychology', () => {
  const r = validateSubjectSelection({ stream: 'COM', subjects: ['1', '4', '49', '50', '51', '48', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('Arts may take a second language in Group B', () => {
  const r = validateSubjectSelection({ stream: 'ART', subjects: ['1', '2', '4', '38', '39', '42', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.aChoice.length, 1);
});

test('Arts may take two languages in Group B (three languages total)', () => {
  const r = validateSubjectSelection({ stream: 'ART', subjects: ['1', '2', '4', '33', '38', '47', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('Commerce with two languages is rejected (no language in Commerce Group B)', () => {
  const r = validateSubjectSelection({ stream: 'COM', subjects: ['1', '2', '4', '49', '50', '51', '31', '30'] });
  assert.equal(r.ok, false);
});

test('Science Bifocal: Paper I replaces language, Paper II replaces Biology', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', 'D9', '40', '54', '55', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.papers, 8);
});

test('Science Bifocal with Biology is rejected', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', 'D9', '40', '54', '56', '31', '30'] });
  assert.ok(codes(r).includes('BIFOCAL_REPLACES_BIOLOGY'));
});

test('two bifocal subjects are rejected', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', 'D9', 'C2', '54', '55', '31', '30'] });
  assert.ok(codes(r).includes('ONE_BIFOCAL_ONLY'));
});

test('Commerce Bifocal replaces one Group B subject', () => {
  const r = validateSubjectSelection({ stream: 'COM', subjects: ['1', 'A5', '49', '50', '51', '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('Science bifocal code is not allowed in Commerce', () => {
  const r = validateSubjectSelection({ stream: 'COM', subjects: ['1', 'D9', '49', '50', '51', '31', '30'] });
  assert.ok(codes(r).includes('NOT_ALLOWED_FOR_STREAM'));
});

test('valid MCVC selection', () => {
  const r = validateSubjectSelection({ stream: 'VOC', subjects: ['1', '2', '31', '30', '90', 'JA/JB/JC'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.papers, 8);
});

test('MCVC without foundation course is rejected', () => {
  const r = validateSubjectSelection({ stream: 'VOC', subjects: ['1', '2', '31', '30', 'JA/JB/JC'] });
  assert.ok(codes(r).includes('FOUNDATION_REQUIRED'));
});

test('MCVC with two vocational subjects is rejected', () => {
  const r = validateSubjectSelection({ stream: 'VOC', subjects: ['1', '2', '31', '30', '90', 'JA/JB/JC', 'GA/GB/GC'] });
  assert.ok(codes(r).includes('ONE_VOCATIONAL_REQUIRED'));
});

test('unlisted subjects produce a warning, not a hard error, and count toward Group C', () => {
  const r = validateSubjectSelection({ stream: 'ART', subjects: ['1', '2', '38', '39', '42', { code: '67', name: 'Vocal Classical Music' }, '31', '30'] });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.warnings[0].code, 'UNLISTED_SUBJECT');
});

test('streams outside the GR skip validation with a warning', () => {
  const r = validateSubjectSelection({ stream: 'TEC', subjects: ['1'] });
  assert.equal(r.ok, true);
  assert.equal(r.warnings[0].code, 'STREAM_NOT_IN_SCHEME');
});

test('duplicate subjects are rejected', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '2', '2', '40', '54', '55', '56', '31', '30'] });
  assert.ok(codes(r).includes('DUPLICATE_SUBJECT'));
});

test('messages are available in English, Marathi and Hindi', () => {
  const r = validateSubjectSelection({ stream: 'SCI', subjects: ['1', '2', '40', '54', '55', '56', '31'] });
  const m = r.errors[0].message;
  assert.match(m.en, /Health and Physical Education/);
  assert.match(m.mr, /आरोग्य व शारीरिक शिक्षण/);
  assert.match(m.hi, /स्वास्थ्य एवं शारीरिक शिक्षा/);
});

test('paper counts', () => {
  assert.equal(paperCount('1'), 1);
  assert.equal(paperCount('D9'), 2);
  assert.equal(paperCount('JA/JB/JC'), 3);
});

test('describeScheme joins DB subjects by code', () => {
  const s = describeScheme({ name: 'Science', shortCode: 'SCI' }, [{ id: 7, code: '54', name: 'Physics' }]);
  assert.equal(s.stream, 'SCIENCE');
  const groupB = s.groups.find((g) => g.key === 'B');
  const physics = groupB.subjects.find((x) => x.code === '54');
  assert.equal(physics.subjectId, 7);
  assert.equal(physics.available, true);
  assert.equal(physics.theory, 70);
  assert.equal(groupB.subjects.find((x) => x.code === '55').available, false);
});

test('checkSubjectScheme: auto mode blocks invalid recognised selections', () => {
  const v = checkSubjectScheme({ name: 'Science' }, [{ subject: { code: '1' } }, { subject: { code: '54' } }], 'auto');
  assert.equal(v.block, true);
});

test('checkSubjectScheme: auto mode is advisory when non-board codes are used', () => {
  const v = checkSubjectScheme({ name: 'Science' }, [{ subject: { code: 'MH101', name: 'Physics' } }], 'auto');
  assert.equal(v.block, false);
  assert.equal(v.result.ok, false);
});

test('checkSubjectScheme: off and strict modes', () => {
  const bad = [{ subject: { code: 'MH101' } }];
  assert.equal(checkSubjectScheme('SCI', bad, 'off').block, false);
  assert.equal(checkSubjectScheme('SCI', bad, 'strict').block, true);
  const good = ['1', '2', '40', '54', '55', '56', '31', '30'].map((code) => ({ subject: { code } }));
  assert.equal(checkSubjectScheme('SCI', good, 'strict').block, false);
});
