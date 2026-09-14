/**
 * Normaliza e avalia origens permitidas para CORS.
 *
 * Fica isolado do Express de propósito: a regra é testável sem subir servidor,
 * e diferenças bobas de digitação (barra no fim, maiúsculas, espaço sobrando)
 * deixam de derrubar o ambiente publicado.
 */

const VERCEL_PREVIEW = /^https:\/\/[a-z0-9][a-z0-9-]*\.vercel\.app$/;

export function normalizeOrigin(origin: string): string {
  return origin.trim().toLowerCase().replace(/\/+$/, '');
}

export function parseAllowedOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter((origin) => origin.length > 0);
}

export function isOriginAllowed(origin: string | undefined, allowed: string[]): boolean {
  // Sem origem: curl, Insomnia e os health checks da hospedagem. Liberado.
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);

  if (allowed.includes(normalized)) return true;

  // Cada publicação de pré-visualização da Vercel recebe um subdomínio novo.
  // Sem isso, só a URL fixa funcionaria e qualquer preview quebraria o login.
  return VERCEL_PREVIEW.test(normalized);
}
