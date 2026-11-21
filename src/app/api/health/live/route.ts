import { NextResponse } from 'next/server';

export const runtime = 'edge';

/** Liveness probe for uptime monitors (no DB/Redis — must not import @/config). */
export function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'ithracode-web' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}