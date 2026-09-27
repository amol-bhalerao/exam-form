import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GrSubjectGuideComponent, SubjectScheme } from './gr-subject-guide.component';
import { I18nService } from '../../core/i18n.service';
import { API_BASE_URL } from '../../core/api';

const L = (en: string, mr = en, hi = en) => ({ en, mr, hi });
const subj = (code: string, name: string, extra: any = {}) => ({
  code, subjectId: null, available: true, kind: 'ELECTIVE', name: L(name, name + ' (mr)', name + ' (hi)'),
  theory: 80, internal: 20, graded: false, papers: 1, ...extra
});

const SCIENCE: SubjectScheme = {
  stream: 'SCIENCE',
  reference: 'GR 2019',
  rules: [L('Total 8 subjects.', 'एकूण ८ विषय.', 'कुल 8 विषय.')],
  groups: [
    { key: 'A', label: L('Group A — compulsory'), pick: { min: 3, max: 3 }, subjects: [subj('1', 'English'), subj('30', 'HPE'), subj('31', 'EVS')] },
    { key: 'A_CHOICE', label: L('Group A — one language'), pick: { min: 1, max: 1 }, subjects: [subj('2', 'Marathi'), subj('4', 'Hindi'), subj('D9', 'Computer Science', { papers: 2 })] },
    { key: 'B', label: L('Group B — minimum 3'), pick: { min: 3, max: 4 }, subjects: [subj('54', 'Physics'), subj('55', 'Chemistry'), subj('56', 'Biology')] },
    { key: 'C', label: L('Group C — up to 1'), pick: { min: 0, max: 1 }, subjects: [subj('41', 'Geology')] }
  ]
};

// institute offers everything except Geology (41)
const OFFERED = [
  { id: 101, code: '1' }, { id: 130, code: '30' }, { id: 131, code: '31' }, { id: 102, code: '2' },
  { id: 104, code: '4' }, { id: 109, code: 'D9' }, { id: 154, code: '54' }, { id: 155, code: '55' }, { id: 156, code: '56' }
];

describe('GrSubjectGuideComponent', () => {
  let fixture: ComponentFixture<GrSubjectGuideComponent>;
  let component: GrSubjectGuideComponent;
  let http: HttpTestingController;
  let i18n: I18nService;

  function setInputs(inputs: Partial<{ stream: string | null; selectedKey: string; offered: any[]; editable: boolean }>) {
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
  }

  const chip = (code: string) =>
    (Array.from(fixture.nativeElement.querySelectorAll('.chip')) as HTMLButtonElement[])
      .find((b) => b.querySelector('.chip-code')!.textContent!.trim() === code)!;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [GrSubjectGuideComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en', { persist: false });
    fixture = TestBed.createComponent(GrSubjectGuideComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  function loadScience(selectedKey = '101,130,131') {
    setInputs({ offered: OFFERED, selectedKey, stream: '1' });
    const req = http.expectOne((r) => r.url === `${API_BASE_URL}/masters/subject-scheme`);
    expect(req.request.params.get('stream')).toBe('1');
    req.flush(SCIENCE);
    fixture.detectChanges();
  }

  it('asks for a stream when none is chosen', () => {
    setInputs({ stream: null });
    expect(fixture.nativeElement.textContent).toContain('Choose your stream');
    http.expectNone(`${API_BASE_URL}/masters/subject-scheme`);
  });

  it('renders the scheme groups and rules', fakeAsync(() => {
    loadScience();
    tick(0);
    http.expectOne(`${API_BASE_URL}/masters/subject-scheme/validate`).flush({ ok: false, stream: 'SCIENCE', errors: [], warnings: [], summary: { papers: 3, groupA: ['1', '30', '31'], aChoice: [], groupB: [], groupC: [], unlisted: [] } });
    fixture.detectChanges();
    const titles = Array.from(fixture.nativeElement.querySelectorAll('.group-title')).map((e: any) => e.textContent.trim());
    expect(titles).toEqual(['Group A — compulsory', 'Group A — one language', 'Group B — minimum 3', 'Group C — up to 1']);
    expect(fixture.nativeElement.querySelector('.rules li').textContent).toContain('Total 8 subjects.');
  }));

  it('shows subject names in the selected language', fakeAsync(() => {
    loadScience();
    tick(0);
    http.expectOne(`${API_BASE_URL}/masters/subject-scheme/validate`).flush({ ok: false, errors: [], warnings: [], summary: { papers: 3, groupA: [], aChoice: [], groupB: [], groupC: [], unlisted: [] } });
    i18n.setLanguage('hi', { persist: false });
    fixture.detectChanges();
    expect(chip('54').textContent).toContain('Physics (hi)');
  }));

  it('locks compulsory subjects and disables subjects the institute does not offer', fakeAsync(() => {
    loadScience();
    tick(0);
    http.expectOne(`${API_BASE_URL}/masters/subject-scheme/validate`).flush({ ok: false, errors: [], warnings: [], summary: { papers: 3, groupA: ['1', '30', '31'], aChoice: [], groupB: [], groupC: [], unlisted: [] } });
    fixture.detectChanges();
    expect(chip('1').disabled).toBeTrue();
    expect(chip('1').classList).toContain('chip-locked');
    expect(chip('41').disabled).toBeTrue();
    expect(chip('41').classList).toContain('chip-off');
    expect(chip('54').disabled).toBeFalse();
  }));

  it('emits add with the institute subject id, and remove for a selected subject', fakeAsync(() => {
    const added: number[] = [];
    const removed: number[] = [];
    component.add.subscribe((id) => added.push(id));
    component.remove.subscribe((id) => removed.push(id));
    loadScience('101,130,131,154');
    tick(0);
    http.expectOne(`${API_BASE_URL}/masters/subject-scheme/validate`).flush({ ok: false, errors: [], warnings: [], summary: { papers: 4, groupA: ['1', '30', '31'], aChoice: [], groupB: ['54'], groupC: [], unlisted: [] } });
    fixture.detectChanges();
    chip('55').click();
    chip('54').click();
    chip('1').click(); // compulsory: ignored
    expect(added).toEqual([155]);
    expect(removed).toEqual([154]);
  }));

  it('does not emit when read-only', fakeAsync(() => {
    const added: number[] = [];
    component.add.subscribe((id) => added.push(id));
    setInputs({ editable: false });
    loadScience();
    tick(0);
    http.expectOne(`${API_BASE_URL}/masters/subject-scheme/validate`).flush({ ok: false, errors: [], warnings: [], summary: { papers: 3, groupA: [], aChoice: [], groupB: [], groupC: [], unlisted: [] } });
    fixture.detectChanges();
    expect(chip('55').disabled).toBeTrue();
    component.toggle(SCIENCE.groups[2].subjects[1]);
    expect(added).toEqual([]);
  }));

  it('validates the selection (debounced) and shows messages in the current language', fakeAsync(() => {
    loadScience();
    tick(0);
    http.expectOne(`${API_BASE_URL}/masters/subject-scheme/validate`).flush({ ok: false, errors: [], warnings: [], summary: { papers: 3, groupA: [], aChoice: [], groupB: [], groupC: [], unlisted: [] } });

    setInputs({ selectedKey: '101,130,131,102,154' });
    setInputs({ selectedKey: '101,130,131,102,154,155' });
    tick(299);
    http.expectNone(`${API_BASE_URL}/masters/subject-scheme/validate`);
    tick(1);
    const req = http.expectOne(`${API_BASE_URL}/masters/subject-scheme/validate`);
    expect(req.request.body.stream).toBe('1');
    expect(req.request.body.subjectIds.sort()).toEqual([101, 102, 130, 131, 154, 155]);
    req.flush({
      ok: false, stream: 'SCIENCE', warnings: [],
      errors: [{ code: 'GROUP_B_MIN', message: L('Select at least 3 subjects from Group B (currently 2).', 'गट ब मधून किमान ३', 'समूह ब से कम से कम 3') }],
      summary: { papers: 6, groupA: ['1', '30', '31'], aChoice: ['2'], groupB: ['54', '55'], groupC: [], unlisted: [] }
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.issue-error').textContent).toContain('Select at least 3 subjects');
    expect(fixture.nativeElement.querySelector('.meter-top strong').textContent.trim()).toBe('6/8');

    i18n.setLanguage('mr', { persist: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.issue-error').textContent).toContain('गट ब मधून किमान ३');
  }));

  it('shows a success line when the selection is valid', fakeAsync(() => {
    loadScience('101,130,131,102,154,155,156');
    tick(0);
    http.expectOne(`${API_BASE_URL}/masters/subject-scheme/validate`).flush({ ok: true, errors: [], warnings: [], summary: { papers: 8, groupA: ['1', '30', '31'], aChoice: ['2'], groupB: ['54', '55', '56'], groupC: [], unlisted: [] } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.issue-ok')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.meter').classList).toContain('meter-ok');
  }));

  it('explains when the stream is outside the GR scheme', () => {
    setInputs({ stream: '5' });
    http.expectOne((r) => r.url === `${API_BASE_URL}/masters/subject-scheme`).flush({ stream: null, reference: 'GR', groups: [], rules: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('not covered by the 2019 GR scheme');
    http.expectNone(`${API_BASE_URL}/masters/subject-scheme/validate`);
  });

  it('degrades gracefully when the scheme cannot be loaded', () => {
    setInputs({ stream: '1' });
    http.expectOne((r) => r.url === `${API_BASE_URL}/masters/subject-scheme`).flush({}, { status: 500, statusText: 'err' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Could not load the subject guide');
  });
});
