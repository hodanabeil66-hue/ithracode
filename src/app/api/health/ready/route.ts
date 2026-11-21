import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import {
  classifyPrismaDatabaseError,
  logPrismaDatabaseError,
} from '@/lib/prisma-database-error';

export type DatabaseReadyStatus =
  | 'ok'
  | 'quota_exceeded'
  | 'unreachable'
  | 'error';

/**
 * Readiness probe: verifies database connectivity and classifies provider quota
 * failures. Use for alerting — not for high-frequency uptime pings (see /live).
 */
export async function GET() {
  let database: DatabaseReadyStatus = 'ok';
  let databaseKind = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logPrismaDatabaseError('HEALTH_READY_DB', error);
    const classified = classifyPrismaDatabaseError(error);
    databaseKind = classified.kind;

    if (classified.kind === 'provider_quota_exceeded') {
      database = 'quota_exceeded';
    } else if (classified.kind === 'database_unreachable') {
      database = 'unreachable';
    } else {
      database = 'error';
    }
  }

  const ready = database === 'ok';

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        database,
        databaseKind,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}