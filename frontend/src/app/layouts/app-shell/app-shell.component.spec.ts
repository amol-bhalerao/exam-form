import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { AppShellComponent } from './app-shell.component';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';
import { API_BASE_URL } from '../../core/api';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let http: HttpTestingController;
  let i18n: I18nService;
  const user = signal<any>(null);
  const logout = jasmine.createSpy('logout');

  function create(role: string, username = 'shivaji.college') {
    user.set({ userId: 1, role, username });
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
  }

  const navLabels = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.nav .nav-item .label')).map((e: any) => e.textContent.trim());

  beforeEach(() => {
    localStorage.clear();
    logout.calls.reset();
    TestBed.configureTestingModule({
      imports: [AppShellComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { user, logout } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en', { persist: false });
  });

  afterEach(() => localStorage.clear());

  it('shows the institute menu and institute name from /me', () => {
    create('INSTITUTE');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: { institute: { name: 'Shri Shivaji College' }, preferredLanguage: null, defaultLanguage: 'en' } });
    fixture.detectChanges();
    expect(navLabels()).toEqual(['Dashboard', 'Applications', 'Institute details', 'Teachers and staff', 'Stream subjects', 'Exam capacity']);
    expect(fixture.nativeElement.querySelector('.context-title').textContent.trim()).toBe('Shri Shivaji College');
  });

  it('shows the student menu', () => {
    create('STUDENT', 'aarav');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: {} });
    fixture.detectChanges();
    expect(navLabels()).toEqual(['Dashboard', 'Student registration', 'Exam forms', 'My payments']);
    expect(fixture.nativeElement.querySelector('.context-title').textContent.trim()).toBe('Student Portal');
  });

  it('shows the board and super admin menus', () => {
    create('BOARD');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: {} });
    fixture.detectChanges();
    expect(navLabels()).toContain('Student master');
    expect(navLabels()).toContain('Streams');
    fixture.destroy();

    create('SUPER_ADMIN');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: {} });
    fixture.detectChanges();
    expect(navLabels()).toContain('Health monitor');
    expect(navLabels()).toContain('Master data');
  });

  it('translates the menu when the language changes', () => {
    create('STUDENT');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: {} });
    i18n.setLanguage('mr', { persist: false });
    fixture.detectChanges();
    expect(navLabels()[0]).toBe('डॅशबोर्ड');
    expect(fixture.nativeElement.querySelector('.context-title').textContent.trim()).toBe('विद्यार्थी पोर्टल');
    i18n.setLanguage('hi', { persist: false });
    fixture.detectChanges();
    expect(navLabels()[0]).toBe('डैशबोर्ड');
  });

  it('applies the account language returned by /me', () => {
    create('BOARD');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: { preferredLanguage: 'hi', defaultLanguage: 'en' } });
    expect(i18n.getLanguage()).toBe('hi');
  });

  it('builds initials from the username', () => {
    create('INSTITUTE', 'shivaji.college');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: {} });
    expect(fixture.componentInstance.initials()).toBe('SC');
  });

  it('includes a language switcher', () => {
    create('STUDENT');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: {} });
    expect(fixture.nativeElement.querySelector('app-language-switcher')).toBeTruthy();
  });

  it('logs out and returns to the login page', () => {
    create('STUDENT');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: {} });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    fixture.componentInstance.logout();
    expect(logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('collapses the desktop sidebar to icons', () => {
    create('STUDENT');
    http.expectOne(`${API_BASE_URL}/me`).flush({ user: {} });
    const c = fixture.componentInstance;
    c.isMobile.set(false); // desktop behaviour regardless of the test window size
    c.toggleCompactSidebar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shell').classList).toContain('is-compact');
    c.toggleCompactSidebar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shell').classList).not.toContain('is-compact');
  });
});
