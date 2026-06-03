import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getAdminCookieName, getJwtSecret } from './auth-cookie';
import { AdminJwtPayload, AdminRequest } from './auth.types';
import { AuthService } from './auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = request.cookies?.[getAdminCookieName()];

    if (!token) {
      throw new UnauthorizedException('Admin login required.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AdminJwtPayload>(
        token,
        {
          secret: getJwtSecret(),
        },
      );

      request.adminUser = await this.authService.validateAdminUser(payload.sub);
      return true;
    } catch {
      throw new UnauthorizedException('Admin login required.');
    }
  }
}
