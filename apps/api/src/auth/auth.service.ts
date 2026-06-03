import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { getJwtExpiresInSeconds, getJwtSecret } from './auth-cookie';
import { LoginDto } from './dto/login.dto';

const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.MANAGER,
  UserRole.FINANCE,
];

const ADMIN_USER_SELECT = {
  id: true,
  companyId: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        ...ADMIN_USER_SELECT,
        password: true,
      },
    });

    if (!user || !user.isActive || !ADMIN_ROLES.includes(user.role)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        companyId: user.companyId,
        email: user.email,
        role: user.role,
      },
      {
        secret: getJwtSecret(),
        expiresIn: getJwtExpiresInSeconds(),
      },
    );

    return {
      token,
      user: this.toSafeUser(user),
    };
  }

  async validateAdminUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: ADMIN_USER_SELECT,
    });

    if (!user || !user.isActive || !ADMIN_ROLES.includes(user.role)) {
      throw new UnauthorizedException('Admin session is no longer valid.');
    }

    return this.toSafeUser(user);
  }

  private toSafeUser(user: {
    id: string;
    companyId: string | null;
    fullName: string;
    email: string;
    phone: string | null;
    role: UserRole;
  }) {
    return {
      id: user.id,
      companyId: user.companyId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
