import { NextResponse } from 'next/server';

/**
 * Sentry browser tunnel. Replaces `tunnelRoute` rewrites, which can 500 on
 * Next.js when the DSN uses a regional ingest host (`r=de` → ingest.de.sentry.io).
 *
 * Only envelopes for the configured DSN are forwarded (no open proxy).
 */
const SENTRY_INGEST_HOST_RE = /^o\d+\.ingest(?:\.[a-z]{2})?\.sentry\.io$/i;

function configuredDsn(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const allowed = configuredDsn();
  if (!allowed) {
    return NextResponse.json(
      { error: 'sentry tunnel disabled' },
      { status: 503 },
    );
  }

  const body = await request.text();
  const headerLine = body.split('\n', 1)[0];
  if (!headerLine) {
    return NextResponse.json({ error: 'invalid envelope' }, { status: 400 });
  }

  let envelopeDsn: URL;
  try {
    const header = JSON.parse(headerLine) as { dsn?: unknown };
    if (typeof header.dsn !== 'string' || !header.dsn) {
      return NextResponse.json({ error: 'missing dsn' }, { status: 400 });
    }
    envelopeDsn = new URL(header.dsn);
  } catch {
    return NextResponse.json(
      { error: 'invalid envelope header' },
      { status: 400 },
    );
  }

  if (
    envelopeDsn.hostname !== allowed.hostname ||
    envelopeDsn.pathname !== allowed.pathname ||
    !SENTRY_INGEST_HOST_RE.test(envelopeDsn.hostname)
  ) {
    return NextResponse.json({ error: 'dsn not allowed' }, { status: 403 });
  }

  const projectId = envelopeDsn.pathname.replaceAll('/', '');
  if (!/^\d+$/.test(projectId)) {
    return NextResponse.json({ error: 'invalid project' }, { status: 400 });
  }

  const upstream = `https://${envelopeDsn.hostname}/api/${projectId}/envelope/`;

  try {
    const upstreamRes = await fetch(upstream, {
      method: 'POST',
      body,
      // Never forward browser cookies / auth headers to Sentry.
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      cache: 'no-store',
    });

    const text = await upstreamRes.text();
    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        'Content-Type':
          upstreamRes.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('[sentry-tunnel] upstream forward failed', error);
    return NextResponse.json({ error: 'tunnel upstream failed' }, { status: 502 });
  }
}
