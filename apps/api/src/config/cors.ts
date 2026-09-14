import { env } from './env.js';
import { parseAllowedOrigins } from '../shared/utils/cors-origin.js';

/** Origens autorizadas a chamar a API, derivadas da variável CORS_ORIGIN. */
export const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN);
