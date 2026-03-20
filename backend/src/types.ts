export type RoleName = 'SUPER_ADMIN' | 'BOARD' | 'INSTITUTE' | 'STUDENT';

export type AuthUser = {
  userId: number;
  role: RoleName;
  instituteId: number | null;
  username: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

