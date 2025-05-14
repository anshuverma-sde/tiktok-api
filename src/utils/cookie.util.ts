import { CookieOptions, Response } from 'express';
import env from '../config/env';
import ms, { StringValue } from 'ms';

type CookiePayloadType = {
  res: Response;
  accessToken: string;
  refreshToken: string;
  persistent?: boolean;
};

const defaults: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  domain: env.nodeEnv === 'production' ? env.cookieDomain : undefined,
  path: '/',
};

const getExpiryDate = (duration: StringValue): Date => {
  const msValue = ms(duration);
  if (typeof msValue !== 'number') {
    throw new Error(`Invalid duration string: ${duration}`);
  }
  return new Date(Date.now() + msValue);
};

export const getRefreshTokenCookieOptions = (persistent: boolean): CookieOptions => {
  const duration = persistent ? env.refreshTokenExpiresInLong : env.refreshTokenExpiresIn;
  const expires = getExpiryDate(duration);
  return {
    ...defaults,
    expires,
  };
};

export const getAccessTokenCookieOptions = (persistent: boolean): CookieOptions => {
  const duration = persistent ? env.accessTokenExpiresInLong : env.accessTokenExpiresIn;
  const expires = getExpiryDate(duration);
  return {
    ...defaults,
    expires,
  };
};

export const setAuthenticationCookies = ({
  res,
  accessToken,
  refreshToken,
  persistent = false , 
}: CookiePayloadType): Response => {
  return res
    .cookie('accessToken', accessToken, getRefreshTokenCookieOptions(persistent))
    .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions(persistent));
};

export const clearAuthenticationCookies = (res: Response): Response => {
  const options: CookieOptions = {
    httpOnly: defaults.httpOnly,
    secure: defaults.secure,
    sameSite: defaults.sameSite,
    domain: defaults.domain,
    path: defaults.path,
  };
  
  return res
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options);
};