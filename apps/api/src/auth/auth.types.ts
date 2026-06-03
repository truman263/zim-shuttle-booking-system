import type { Request } from 'express';
import { UserRole } from '@prisma/client';

export type AdminJwtPayload = {
  sub: string;
  companyId: string | null;
  email: string;
  role: UserRole;
};

export type AuthenticatedAdminUser = {
  id: string;
  companyId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
};

export type AdminRequest = Request & {
  adminUser?: AuthenticatedAdminUser;
};
