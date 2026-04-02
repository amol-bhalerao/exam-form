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
  
  // For STUDENT role, require basic profile (institute + stream selection)
  // They can access profile form to fill details, but need basic profile first
  try {
    await profileService.loadProfile();
    const profile = profileService.profile$();
    
    // Check if basic profile exists (institute + stream selected)
    if (!profile || !profile.instituteId || !profile.streamCode) {
      console.warn('Profile guard: Basic profile missing (no institute/stream). Redirecting to institute selection.');
      router.navigate(['/student/select-institute']);
      return false;
    }
    
    console.log('Profile guard: Basic profile found. Allowing access.');
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

// Application guard - allows exam form access at 70% profile completion
// Requires: authentication + student role + profile exists + 70% profile completion
export const applicationGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const profileService = inject(StudentProfileService);
  
  const isLoggedIn = auth.isLoggedIn();
  const user = auth.user();
  
  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  
  // Non-student roles don't need guard
  if (user?.role && user.role !== 'STUDENT') {
    return true;
  }
  
  // For STUDENT role, ensure profile exists and is at least 70% complete
  try {
    await profileService.loadProfile();
    const profile = profileService.profile$();
    const completionPercentage = profileService.completionPercentage$();
    
    if (!profile) {
      console.warn('Application guard: No profile found. Redirecting to institute selection.');
      router.navigate(['/student/select-institute']);
      return false;
    }
    
    if (completionPercentage < 70) {
      console.warn(`Application guard: Profile only ${completionPercentage}% complete. Minimum 70% required. Redirecting to profile.`);
      router.navigate(['/app/student/profile'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
    
    console.log(`Application guard: Profile ${completionPercentage}% complete. Access allowed.`);
    return true;
  } catch (error: any) {
    // Log for debugging
    console.warn('Application guard error:', error);
    
    if (error?.error?.error === 'STUDENT_PROFILE_MISSING' || error?.status === 404) {
      // Profile missing - must select institute first
      console.warn('Application guard: Profile missing (404). Redirecting to institute selection.');
      router.navigate(['/student/select-institute']);
      return false;
    }
    
    // For other errors, deny access to be safe
    console.warn('Application guard: Error loading profile, denying access');
    router.navigate(['/app/student/profile']);
    return false;
  }
};
