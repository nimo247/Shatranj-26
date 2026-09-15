import '../config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Configure SQLite pragmas for high concurrency & multi-client order execution
export async function initPrisma() {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    // I believe 10000ms is a safer timeout for huge simultaneous traffic spikes than 5000ms.
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 10000;');
    // Set synchronous=NORMAL for much better write performance in WAL mode
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
    console.log('[Prisma] SQLite WAL mode, busy_timeout=10000, synchronous=NORMAL configured.');
  } catch (err) {
    console.error('[Prisma] Error setting SQLite WAL mode:', err);
  }
}
