import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient as SQLitePrismaClient } from '../../generated/prisma-test';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getActiveEngine(): 'postgres' | 'sqlite' {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  return /^postgres(ql)?:\/\//.test(dbUrl) ? 'postgres' : 'sqlite';
}

const getPrismaInstance = (): PrismaClient => {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  if (getActiveEngine() === 'sqlite') {
    const sqlite = new SQLitePrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbUrl }) });
    return sqlite as unknown as PrismaClient;
  }

  const configuredPoolSize = Number.parseInt(process.env.DATABASE_POOL_SIZE || '1', 10);
  const adapter = new PrismaPg({
    connectionString: dbUrl,
    max: Number.isFinite(configuredPoolSize) && configuredPoolSize > 0 ? configuredPoolSize : 1,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? getPrismaInstance();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
