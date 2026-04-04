import { Injectable, signal, inject, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import type { GoogleLoginResponse } from './auth.types';
import { rateLimiter } from './rate-limiter';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private authService = inject(AuthService);

  // Google OAuth Client ID - from Google Cloud Console
  private googleClientId = '260515642590-5ipgojov7maa51m9j8hutpcu01dckkui.apps.googleusercontent.com';
  
  // Load script from CDN
  private googleScriptLoaded = signal(false);
  private googleInitialized = false;  // Guard against multiple initializations

  // Use a local dev fallback button on localhost to avoid Google origin restrictions
  private readonly devMode = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

  constructor() {
    if (this.devMode) {
      this.googleScriptLoaded.set(true);
      return;
    }
    this.loadGoogleScript();
  }

  private loadGoogleScript() {
    if (this.devMode || document.getElementById('google-sign-in-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-sign-in-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      this.googleScriptLoaded.set(true);
      // Google Sign-In script loaded
    };
  }

  // Initialize Google Sign-In button
  initializeGoogleSignIn(elementId: string, onSuccess: (token: string) => void, onError: () => void) {
    // If in dev mode, use a test button
    if (this.devMode) {
      this.renderTestButton(elementId, onSuccess, onError);
      return;
    }

    if (!this.googleScriptLoaded()) {
      setTimeout(() => this.initializeGoogleSignIn(elementId, onSuccess, onError), 1000);
      return;
    }

    // Prevent multiple initializations - only initialize once
    if (this.googleInitialized) {
      // If already initialized, just ensure the button is rendered
      (window as any).google?.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'outline',
          size: 'large',
          width: '300'
        }
      );
      return;
    }

    (window as any).google?.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response: any) => {
        if (response.credential) {
          this.handleGoogleSignIn(response.credential).subscribe(
            success => onSuccess(response.credential),
            error => onError()
          );
        }
      },
      error_callback: onError
    });

    (window as any).google?.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        width: '300'
      }
    );

    this.googleInitialized = true;  // Mark as initialized
  }

  // Render a test button for development mode
  private renderTestButton(elementId: string, onSuccess: (token: string) => void, onError: () => void) {
    const button = document.getElementById(elementId);
    if (!button) return;

    button.innerHTML = `
      <button id="test-signin-btn" style="
        padding: 10px 20px;
        border: 1px solid #dadce0;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 300px;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#1f2937" stroke-width="2"/>
          <text x="12" y="15" text-anchor="middle" fill="#1f2937" font-size="10" font-weight="bold">TEST</text>
        </svg>
        Sign in with Google (TEST MODE)
      </button>
    `;

    const testButton = button.querySelector('#test-signin-btn') as HTMLButtonElement;
    if (testButton) {
      testButton.addEventListener('click', () => {
        // Test mode: Attempting authentication with mock Google token
        testButton.disabled = true;
        testButton.textContent = 'Signing in...';
        
        // In local test mode, use a stable mock token so the same student account can log in again
        const mockToken = 'mock_google_token_for_testing_local-student';
        this.handleGoogleSignIn(mockToken).subscribe(
          (response) => {
            // Test authentication successful
            testButton.disabled = false;
            onSuccess(mockToken);
          },
          (error) => {
            // Test auth failed
            testButton.disabled = false;
            testButton.textContent = 'Sign in with Google (TEST MODE)';
            onError();
          }
        );
      });
    }
  }

  // Handle Google Sign-In token by delegating to AuthService
  handleGoogleSignIn(token: string): Observable<GoogleLoginResponse> {
    // Use AuthService to handle the auth flow - it manages token storage and state
    return this.authService.googleLogin(token);
  }

  // Check if user is logged in - expose as signal/computed
  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());

  // Logout (delegate to AuthService)
  logout() {
    // Clear rate limiter on logout
    rateLimiter.clearAll();
    this.authService.logout();
    // Sign out from Google
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }
}
