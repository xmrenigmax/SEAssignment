
import rateLimit from 'express-rate-limit';

/**
 * @description Rate Limiting - INCREASED LIMIT to prevent 429 Errors.
 * Window: 15 minutes.
 * Max: 3000 requests.
 */
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  message: {
    error: "Too many requests, please contemplate in silence for a while."
  }
});