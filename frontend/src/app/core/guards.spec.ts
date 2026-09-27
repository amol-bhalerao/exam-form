import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { StudentProfileService } from './student-profile.service';
import { authGuard, studentGuard, profileGuard, applicationGuard } from './auth.guard';
import { roleGuard } from './role.guard';

describe('route guards', () => {
  let loggedIn: boolean;
  let role: string | null;
  let router: Router;
  let loadProfile: jasmine.Spy;

  beforeEach(() => {
    loggedIn = true;
    role = 'STUDENT';
    loadProfile = jasmine.createSpy('loadProfile').and.returnValue(Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => loggedIn, user: () => (role ? { role } : null) } },
        { provide: StudentProfileService, useValue: { loadProfile, profile$: () => null } }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  const run = (guard: any) => TestBed.runInInjectionContext(() => guard({} as any, { url: '/x' } as any));
  const asUrl = (v: any) => (v instanceof UrlTree ? router.serializeUrl(v) : v);

  it('authGuard lets signed-in users through and sends others to /login', () => {
    expect(run(authGuard)).toBeTrue();
    loggedIn = false;
    expect(asUrl(run(authGuard))).toBe('/login');
  });

  it('roleGuard allows listed roles only', () => {
    expect(run(roleGuard(['STUDENT']))).toBeTrue();
    expect(asUrl(run(roleGuard(['BOARD'])))).toBe('/');
    role = null;
    expect(asUrl(run(roleGuard(['BOARD'])))).toBe('/login');
  });

  it('studentGuard sends staff to their dashboard (not a missing /unauthorized page)', () => {
    role = 'INSTITUTE';
    expect(run(studentGuard)).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('studentGuard requires sign-in', () => {
    loggedIn = false;
    expect(run(studentGuard)).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('profileGuard allows staff and students', async () => {
    expect(await run(profileGuard)).toBeTrue();
    role = 'BOARD';
    expect(await run(profileGuard)).toBeTrue();
  });

  it('applicationGuard never blocks a student because the profile is incomplete', async () => {
    loadProfile.and.returnValue(Promise.reject({ status: 404, error: { error: 'STUDENT_PROFILE_MISSING' } }));
    expect(await run(applicationGuard)).toBeTrue();
  });

  it('applicationGuard requires sign-in', async () => {
    loggedIn = false;
    expect(await run(applicationGuard)).toBeFalse();
  });
});
