import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StudentApplicationEditComponent } from './student-application-edit.component';

/**
 * Covers the subject logic behind the GR subject guide: the guide emits
 * subject ids and the form is the source of truth.
 */
describe('StudentApplicationEditComponent – subject selection', () => {
  let c: StudentApplicationEditComponent;

  const SUBJECTS = [
    { id: 101, code: '1', name: 'English', category: 'Compulsory' },
    { id: 130, code: '30', name: 'HPE', category: 'Compulsory' },
    { id: 131, code: '31', name: 'EVS', category: 'Compulsory' },
    { id: 102, code: '2', name: 'Marathi', category: 'language' },
    { id: 154, code: '54', name: 'Physics', category: 'Optional Subjects' },
    { id: 155, code: '55', name: 'Chemistry', category: 'Optional Subjects' }
  ];

  const ids = () => c.getSubjectIndices().map((i) => c.getSubjectFormGroup(i).get('subjectId')?.value);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [StudentApplicationEditComponent, NoopAnimationsModule],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    // ngOnInit is not run: no HTTP needed, we drive the form directly
    c = TestBed.createComponent(StudentApplicationEditComponent).componentInstance;
    c.application.set({ status: 'DRAFT', fees: [] });
    c.masterSubjects.set(SUBJECTS as any);
    (c as any).ensureCompulsorySubjectsSelected();
  });

  it('pre-selects the compulsory subjects', () => {
    expect(ids()).toEqual(jasmine.arrayContaining([101, 130, 131]));
  });

  it('adds a subject chosen in the guide and keeps the key in sync', () => {
    c.addSubjectFromGuide(154);
    expect(ids()).toContain(154);
    expect(c.selectedSubjectKey().split(',').map(Number)).toContain(154);
  });

  it('fills an empty row before adding a new one', () => {
    c.addSubject();
    const rows = c.subjects().length;
    c.addSubjectFromGuide(102);
    expect(c.subjects().length).toBe(rows);
    expect(ids()).toContain(102);
  });

  it('does not add the same subject twice', () => {
    c.addSubjectFromGuide(154);
    const rows = c.subjects().length;
    c.addSubjectFromGuide(154);
    expect(c.subjects().length).toBe(rows);
  });

  it('removes a subject from the guide but never a compulsory one', () => {
    c.addSubjectFromGuide(154);
    c.removeSubjectFromGuide(154);
    expect(ids()).not.toContain(154);
    c.removeSubjectFromGuide(101);
    expect(ids()).toContain(101);
  });

  it('stops at 9 subjects', () => {
    for (let id = 200; id < 215; id++) c.addSubjectFromGuide(id);
    expect(c.subjects().length).toBe(9);
  });

  it('ignores the guide when the application is no longer editable', () => {
    c.application.set({ status: 'SUBMITTED', fees: [] });
    c.addSubjectFromGuide(155);
    expect(ids()).not.toContain(155);
  });

  it('keeps search labels correct after a row is removed', () => {
    c.addSubjectFromGuide(154);
    c.addSubjectFromGuide(155);
    const physicsRow = ids().indexOf(154);
    c.getSubjectSearchLabel(physicsRow + 1); // cache the Chemistry label at its old index
    c.removeSubjectFromGuide(154);
    const chemRow = ids().indexOf(155);
    expect(c.getSubjectSearchLabel(chemRow)).toBe('55 - Chemistry');
  });
});
