import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_BASE_URL } from './api';
import type { AuthUser, LoginResponse, GoogleLoginResponse } from './auth.types';

type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const STORAGE_KEY = 'hsc_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _auth = signal<StoredAuth | null>(this.readStorage());

  readonly user = computed(() => this._auth()?.user ?? null);
  readonly accessToken = computed(() => this._auth()?.accessToken ?? null);
  readonly isLoggedIn = computed(() => !!this._auth());

  constructor(private readonly http: HttpClient) {}

  /** Credential login (BOARD, SUPER_ADMIN, INSTITUTE, and legacy students) */
  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, { username, password }).pipe(
      tap((resp) => this.setAuth({ accessToken: resp.accessToken, refreshToken: resp.refreshToken, user: resp.user }))
    );
  }

  /** Google SSO login (students only) — sends Google credential to backend for verification */
  googleLogin(credential: string) {
    return this.http.post<GoogleLoginResponse>(`${API_BASE_URL}/auth/google`, { credential }).pipe(
      tap((resp) => this.setAuth({ accessToken: resp.accessToken, refreshToken: resp.refreshToken, user: resp.user }))
    );
  }

  logout() {
    const current = this._auth();
    this._auth.set(null);
    localStorage.removeItem(STORAGE_KEY);
    if (!current) return;
    this.http.post(`${API_BASE_URL}/auth/logout`, { refreshToken: current.refreshToken }).subscribe({ error: () => {} });
  }

  refreshAccessToken() {
    const current = this._auth();
    if (!current) return Promise.resolve(null);
    return this.http
      .post<{ accessToken: string; user: AuthUser }>(`${API_BASE_URL}/auth/refresh`, { refreshToken: current.refreshToken })
      .toPromise()
      .then((resp) => {
        if (!resp?.accessToken) return null;
        this.setAuth({ ...current, accessToken: resp.accessToken, user: resp.user });
        return resp.accessToken;
      })
      .catch(() => null);
  }

  /** Update access token and user info (used after institute selection) */
  updateAccessToken(accessToken: string, user?: AuthUser) {
    const current = this._auth();
    if (!current) return;
    this.setAuth({ ...current, accessToken, user: user || current.user });
  }

  private setAuth(auth: StoredAuth) {
    this._auth.set(auth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }

  private readStorage(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredAuth;
    } catch {
      return null;
    }
  }
}

