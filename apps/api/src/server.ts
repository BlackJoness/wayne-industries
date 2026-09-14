import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API das Indústrias Wayne no ar em http://localhost:${env.PORT}/api/v1`);
});

const shutdown = async (signal: string): Promise<void> => {
  console.log(`\nRecebido ${signal}. Encerrando com segurança...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
