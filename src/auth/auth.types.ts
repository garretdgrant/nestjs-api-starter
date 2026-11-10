import type { Request } from 'express';
import type { Role } from '../generated/prisma/client';

/** Claims carried by the access token. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/** The authenticated caller, attached to the request by AuthGuard. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export type AuthenticatedRequest = Request & { user?: AuthUser };
