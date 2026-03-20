export type RoleName = 'SUPER_ADMIN' | 'BOARD' | 'INSTITUTE' | 'STUDENT';

export type AuthUser = {
  userId: number;
  username: string;
  role: RoleName;
  instituteId: number | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

