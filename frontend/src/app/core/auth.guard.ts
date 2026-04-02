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
      console.warn('Session expired. Redirecting to login.');
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
      console.log('Profile not yet created - will allow student to create it');
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
  console.log('Profile guard: Allowing student to access profile page.');
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
    
    // Check for specific errors that indicate institute not selected
    const errorCode = error?.error?.error || error?.message;
    if (errorCode === 'INSTITUTE_NOT_SELECTED' || 
        errorCode === 'STUDENT_PROFILE_MISSING' || 
        error?.status === 404) {
      // Profile missing - must select institute first
      console.warn('Application guard: Institute not selected. Redirecting to institute selection.');
      router.navigate(['/student/select-institute']);
      return false;
    }
    
    // For other errors, deny access to be safe
    console.warn('Application guard: Error loading profile, denying access');
    router.navigate(['/app/student/profile']);
    return false;
  }
};
