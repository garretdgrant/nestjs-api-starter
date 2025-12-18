import { Client, Project, User } from '@generated/prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  clientId: string | null;
}

export type SafeUser = Omit<User, 'hashedPassword'>;
export type SafeClient = Client;
export type SafeProject = Project;

export function toSafeUser(user: User): SafeUser {
  const { hashedPassword, ...safeUser } = user;
  void hashedPassword;
  return safeUser;
}
