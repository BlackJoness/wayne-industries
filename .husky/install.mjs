// Instala os hooks do husky apenas em máquina de desenvolvimento.
// Em CI, produção ou sem repositório git (Vercel, Render), não faz nada.
import { existsSync } from 'node:fs';
if (process.env.CI || process.env.NODE_ENV === 'production' || !existsSync('.git')) {
  process.exit(0);
}
const { default: husky } = await import('husky');
console.log(husky());
