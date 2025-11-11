import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
});

export const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many location updates',
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many messages',
});

export const sosLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'SOS limit reached',
});
