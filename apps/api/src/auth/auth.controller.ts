import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  getAdminCookieClearOptions,
  getAdminCookieName,
  getAdminCookieOptions,
} from './auth-cookie';
import { AdminAuthGuard } from './admin-auth.guard';
import type { AdminRequest } from './auth.types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    response.cookie(
      getAdminCookieName(),
      result.token,
      getAdminCookieOptions(),
    );

    return {
      user: result.user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(getAdminCookieName(), getAdminCookieClearOptions());

    return {
      message: 'Logged out successfully.',
    };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@Req() request: AdminRequest) {
    return request.adminUser;
  }
}
