import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { StudentProfileService } from './student-profile.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  // Check if user is authenticated
  if (auth.isLoggedIn()) {
    return true;
  }
  
  return router.parseUrl('/login');
};

// Guard for forms - requires authentication + complete profile
export const formGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const profileService = inject(StudentProfileService);
  
  const isLoggedIn = auth.isLoggedIn();
  if (!isLoggedIn) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
  
  // Check if student has completed profile (institute + stream selected)
  try {
    // Load profile to check if it exists
    await profileService.loadProfile();
    const profile = profileService.profile$();
    
    // If no profile, redirect to institute selection
    if (!profile) {
      router.navigate(['/student/select-institute']);
      return false;
    }
    
    return true;
  } catch (error: any) {
    // If we get a STUDENT_PROFILE_MISSING error, redirect to institute selection
    if (error?.error?.error === 'STUDENT_PROFILE_MISSING' || error?.status === 404) {
      router.navigate(['/student/select-institute']);
      return false;
    }
    
    // For other errors, allow access (could be network issue)
    return true;
  }
};

// Profile completion guard - requires authenticated student with complete profile
// Non-student roles bypass profile check
export const profileGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const profileService = inject(StudentProfileService);
  
  const isLoggedIn = auth.isLoggedIn();
  const user = auth.user();
  
  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  
  // Non-student roles don't need profile check
  if (user?.role && user.role !== 'STUDENT') {
    return true;
  }
  
  // For STUDENT role, enforce profile completion
  // Check if student profile exists and is complete
  try {
    await profileService.loadProfile();
    const profile = profileService.profile$();
    
    if (!profile) {
      console.warn('Profile guard: No profile found. Redirecting to institute selection.');
      router.navigate(['/student/select-institute']);
      return false;
    }
    
    console.log('Profile guard: Profile found. Allowing access.');
    return true;
  } catch (error: any) {
    // Log for debugging
    console.warn('Profile guard error:', error);
    
    if (error?.error?.error === 'STUDENT_PROFILE_MISSING' || error?.status === 404) {
      // Profile missing - must select institute first
      console.warn('Profile guard: Profile missing (404). Redirecting to institute selection.');
      router.navigate(['/student/select-institute']);
      return false;
    }
    
    // For other errors, allow access to not block user experience
    console.warn('Profile guard: Error loading profile, allowing access');
    return true;
  }
};

// Student-only guard
export const studentGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const isLoggedIn = auth.isLoggedIn();
  const user = auth.user();
  
  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  
  if (user?.role && user.role !== 'STUDENT') {
    router.navigate(['/unauthorized']);
    return false;
  }
  
  return true;
};

