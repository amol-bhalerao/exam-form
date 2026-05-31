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
    
    // Profile is now optional - students can fill it anytime
    // Even if profile doesn't exist yet, allow access to create it
    return true;
  } catch (error: any) {
    // Check if this is a session expiry error (401 Unauthorized)
    if (error?.status === 401) {
      // Session expired. Redirecting to login.
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
    
    // If we get a specific error about institute not selected, log it but allow access
    // Students can now select institute within the profile page
    const errorCode = error?.error?.error || error?.message;
    if (errorCode === 'INSTITUTE_NOT_SELECTED' || 
        errorCode === 'STUDENT_PROFILE_MISSING' || 
        error?.status === 404) {
      // Profile not yet created - will allow student to create it
    }
    
    // For other errors, allow access (could be network issue)
    return true;
  }
};

// Profile guard - allows students to access profile page anytime
// Institute + stream selection is now part of the profile page itself
export const profileGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
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
  
  // For STUDENT role - allow access anytime (no requirements)
  // Students can fill institute selection + all profile details in one place
  // Profile guard: Allowing student to access profile page.
  return true;
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

// Application guard - authenticated student access.
// Multi-student flow allows users to manage student profiles and create applications
// without blocking the route behind profile percentage thresholds.
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
  
  // For STUDENT role, load profile best-effort but do not hard block route access.
  try {
    await profileService.loadProfile();
    return true;
  } catch (error: any) {
    // Log for debugging
    console.warn('Application guard error:', error);
    
    // Check for specific errors that indicate institute not selected
    const errorCode = error?.error?.error || error?.message;
    if (errorCode === 'INSTITUTE_NOT_SELECTED' || 
        errorCode === 'STUDENT_PROFILE_MISSING' || 
        error?.status === 404) {
      // Allow route; UI handles empty-state/profile creation gracefully.
      return true;
    }
    // Network/transient errors should not block navigation.
    return true;
  }
};
