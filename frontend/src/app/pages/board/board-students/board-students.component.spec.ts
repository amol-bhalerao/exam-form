import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { BoardStudentsComponent } from './board-students.component';

describe('BoardStudentsComponent', () => {
  let component: BoardStudentsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BoardStudentsComponent,
        {
          provide: HttpClient,
          useValue: {
            get: () =>
              of({
                rows: [],
                metadata: { page: 1, limit: 100, total: 0, availableCastes: [] },
                exams: [],
                subjects: []
              })
          }
        }
      ]
    });

    component = TestBed.inject(BoardStudentsComponent);
  });

  it('creates component and has export columns', () => {
    expect(component).toBeTruthy();
    expect(component.exportColumns.length).toBeGreaterThan(20);
  });

  it('builds query params from selected filters', () => {
    component.examId = '11';
    component.status = 'BOARD_APPROVED';
    component.caste = 'SC';
    component.subjectId = '7';
    component.search = 'pawar';
    component.sortBy = 'subject';
    component.sortOrder = 'asc';

    const params = (component as any).buildParams(2, 250) as URLSearchParams;

    expect(params.get('examId')).toBe('11');
    expect(params.get('status')).toBe('BOARD_APPROVED');
    expect(params.get('caste')).toBe('SC');
    expect(params.get('subjectId')).toBe('7');
    expect(params.get('search')).toBe('pawar');
    expect(params.get('sortBy')).toBe('subject');
    expect(params.get('sortOrder')).toBe('asc');
    expect(params.get('page')).toBe('2');
    expect(params.get('limit')).toBe('250');
  });
});
