import { describe, expect, it } from 'vitest';
import { isOriginAllowed, normalizeOrigin, parseAllowedOrigins } from '../src/shared/utils/cors-origin.js';

describe('política de origens do CORS', () => {
  it('remove barra final, espaços e maiúsculas ao normalizar', () => {
    expect(normalizeOrigin('  https://Wayne-Industries-Web.Vercel.App/  ')).toBe(
      'https://wayne-industries-web.vercel.app',
    );
  });

  it('aceita lista separada por vírgula e descarta itens vazios', () => {
    expect(parseAllowedOrigins('https://a.com, https://b.com/ ,,')).toEqual(['https://a.com', 'https://b.com']);
  });

  it('libera a origem configurada', () => {
    const allowed = parseAllowedOrigins('https://wayne-industries-web.vercel.app');
    expect(isOriginAllowed('https://wayne-industries-web.vercel.app', allowed)).toBe(true);
  });

  it('libera mesmo quando a variável foi salva com barra no final', () => {
    const allowed = parseAllowedOrigins('https://wayne-industries-web.vercel.app/');
    expect(isOriginAllowed('https://wayne-industries-web.vercel.app', allowed)).toBe(true);
  });

  it('libera pré-visualizações da Vercel', () => {
    const allowed = parseAllowedOrigins('https://wayne-industries-web.vercel.app');
    expect(isOriginAllowed('https://wayne-industries-edwi1rp18-jonesblack.vercel.app', allowed)).toBe(true);
  });

  it('libera requisições sem origem, como curl e health checks', () => {
    expect(isOriginAllowed(undefined, [])).toBe(true);
  });

  it('bloqueia origem estranha', () => {
    const allowed = parseAllowedOrigins('https://wayne-industries-web.vercel.app');
    expect(isOriginAllowed('https://site-malicioso.com', allowed)).toBe(false);
  });

  it('bloqueia domínio que apenas termina parecido com vercel.app', () => {
    const allowed = parseAllowedOrigins('https://wayne-industries-web.vercel.app');
    expect(isOriginAllowed('https://a.b.vercel.app.evil.com', allowed)).toBe(false);
  });
});
