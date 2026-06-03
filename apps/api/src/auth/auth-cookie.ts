import type { CookieOptions } from 'express';

const DEFAULT_EXPIRES_IN = '8h';

export function getAdminCookieName() {
  return process.env.ADMIN_COOKIE_NAME || 'ladybird_admin_session';
}

export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN;
}

export function getJwtExpiresInSeconds() {
  return Math.floor(parseDurationMs(getJwtExpiresIn()) / 1000);
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production.');
  }

  return secret || 'ladybird-local-dev-admin-secret';
}

export function getAdminCookieOptions(): CookieOptions {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    process.env.ADMIN_COOKIE_SECURE === 'true';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: parseDurationMs(getJwtExpiresIn()),
  };
}

export function getAdminCookieClearOptions(): CookieOptions {
  const { maxAge, ...options } = getAdminCookieOptions();
  return options;
}

function parseDurationMs(value: string) {
  const match = value.trim().match(/^(\d+)(m|h|d)?$/i);

  if (!match) {
    return 8 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = (match[2] || 'h').toLowerCase();

  if (unit === 'm') {
    return amount * 60 * 1000;
  }

  if (unit === 'd') {
    return amount * 24 * 60 * 60 * 1000;
  }

  return amount * 60 * 60 * 1000;
}
