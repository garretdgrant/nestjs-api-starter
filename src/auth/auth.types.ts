import { User } from '@generated/prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  clientId: string | null;
}

export type SafeUser = Omit<User, 'hashedPassword'>;

export function toSafeUser(user: User): SafeUser {
  const { hashedPassword, ...safeUser } = user;
  void hashedPassword;
  return safeUser;
}
