import app from './app';
import { env } from './config/env';
import { prisma, disconnectPrisma } from './config/prisma';

const PORT = parseInt(env.PORT, 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 Mini ERP Backend Server listening on port ${PORT} [${env.NODE_ENV}]`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🔒 HTTP Server closed.');
    await disconnectPrisma();
    console.log('💾 Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
