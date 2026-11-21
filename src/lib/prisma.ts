import { env } from '@/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

// Normalize connection string to replace sslmode=require (or prefer or verify-ca) with sslmode=verify-full
// to prevent the pg-connection-string warning without altering behavior.
const connectionString = env.DATABASE_URL.replace(
  /([?&]sslmode=)(require|prefer|verify-ca)\b/gi,
  '$1verify-full',
);

/**
 * One Pool per warm serverless isolate (Neon pooler multiplexes upstream).
 * max: 1 limits concurrent PG backends per instance; raise only with load evidence.
 */
const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}