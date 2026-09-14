import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://wayne:wayne@localhost:5433/wayne_industries_test?schema=public',
      JWT_SECRET: 'segredo-de-teste-com-mais-de-16-caracteres',
      JWT_EXPIRES_IN: '1h',
      CORS_ORIGIN: 'http://localhost:5173',
    },
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/modules/**/*.service.ts', 'src/modules/**/*.policy.ts', 'src/shared/**/*.ts'],
    },
  },
});
