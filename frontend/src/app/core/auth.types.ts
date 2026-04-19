export type RoleName = 'SUPER_ADMIN' | 'BOARD' | 'INSTITUTE' | 'STUDENT';

export type AuthUser = {
  userId: number;
  username: string;
  email?: string;
  role: RoleName;
  instituteId: number | null;
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

