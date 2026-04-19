import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { StudentFormPrintComponent } from './student-form-print.component';
import { BrandingService } from '../../../core/branding.service';

describe('StudentFormPrintComponent', () => {
  let component: StudentFormPrintComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StudentFormPrintComponent,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        },
        {
          provide: HttpClient,
          useValue: {
            get: () => of({})
          }
        },
        {
          provide: BrandingService,
          useValue: {
            getWebsite: () => 'https://example.com'
          }
        }
      ]
    });

    component = TestBed.inject(StudentFormPrintComponent);
  });

  it('prefers profile photo and signature over application fallback', () => {
    component.application.set({
      student: {
        photoUrl: 'https://backend.example/uploads/students/a-photo.jpg',
        signatureUrl: 'https://backend.example/uploads/students/a-sign.jpg'
      }
    });

    component.studentProfile.set({
      photoUrl: 'https://backend.example/uploads/students/p-photo.jpg',
      signatureUrl: 'https://backend.example/uploads/students/p-sign.jpg'
    });

    expect(component.s().photoUrl).toContain('p-photo.jpg');
    expect(component.s().signatureUrl).toContain('p-sign.jpg');
  });

  it('returns relative upload URLs as absolute with cache busting', () => {
    const value = (component as any).withCacheBust('/uploads/students/student-10-photo.jpg');

    expect(value).toContain('/uploads/students/student-10-photo.jpg');
    expect(value).toContain('v=');
  });

  it('formats missing values as dash', () => {
    expect(component.valueOrDash(null)).toBe('—');
    expect(component.valueOrDash('')).toBe('—');
    expect(component.valueOrDash('ABC')).toBe('ABC');
  });
});
