export type RoleName = 'SUPER_ADMIN' | 'BOARD' | 'INSTITUTE' | 'STUDENT';

export type AuthUser = {
  userId: number;
  username: string;
  email?: string;
  role: RoleName;
  instituteId: number | null;
  boardType?: 'HSC' | 'SSC';
  /** Language saved on the account (null until the user picks one). */
  preferredLanguage?: 'mr' | 'en' | 'hi' | null;
  /** Role default: students 'mr', staff 'en'. */
  defaultLanguage?: 'mr' | 'en' | 'hi';
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type GoogleLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

