import { Prisma } from '@prisma/client';

export type PrismaDatabaseErrorKind =
  | 'provider_quota_exceeded'
  | 'database_unreachable'
  | 'unknown';

export type ClassifiedPrismaDatabaseError = {
  kind: PrismaDatabaseErrorKind;
  /** Operator-facing detail; includes the provider message when present. */
  detail: string;
  sqlState?: string;
};

const QUOTA_MESSAGE_RE = /exceeded the quota/i;
const NEON_QUOTA_SQLSTATE = '53000';

function collectErrorText(error: unknown): string[] {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current != null && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);

    if (current instanceof Error) {
      if (current.message) parts.push(current.message);
      if (current.name) parts.push(current.name);
    }

    const meta =
      current instanceof Prisma.PrismaClientKnownRequestError
        ? current.meta
        : undefined;
    if (meta && typeof meta === 'object' && 'message' in meta) {
      const message = (meta as { message?: unknown }).message;
      if (typeof message === 'string') parts.push(message);
    }

    const cause =
      current instanceof Error
        ? current.cause
        : typeof current === 'object' && 'cause' in current
          ? (current as { cause?: unknown }).cause
          : undefined;

    if (cause !== undefined) {
      current = cause;
      continue;
    }
    break;
  }

  return parts;
}

function sqlStateFromErrorChain(error: unknown): string | undefined {
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current != null && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);

    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && /^\d{5}$/.test(code)) {
      return code;
    }

    const cause =
      current instanceof Error
        ? current.cause
        : 'cause' in current
          ? (current as { cause?: unknown }).cause
          : undefined;

    if (cause !== undefined) {
      current = cause;
      continue;
    }
    break;
  }

  return undefined;
}

export function classifyPrismaDatabaseError(
  error: unknown,
): ClassifiedPrismaDatabaseError {
  const texts = collectErrorText(error).join(' ');
  const sqlState = sqlStateFromErrorChain(error);
  const prismaCode =
    error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;

  if (QUOTA_MESSAGE_RE.test(texts) || sqlState === NEON_QUOTA_SQLSTATE) {
    return {
      kind: 'provider_quota_exceeded',
      detail: texts || 'Database provider quota exceeded',
      sqlState: sqlState ?? NEON_QUOTA_SQLSTATE,
    };
  }

  if (
    prismaCode === 'P1001' ||
    /DatabaseNotReachable|Can't reach database server/i.test(texts)
  ) {
    return {
      kind: 'database_unreachable',
      detail: texts || 'Database unreachable',
      sqlState,
    };
  }

  return {
    kind: 'unknown',
    detail: texts || 'Unknown database error',
    sqlState,
  };
}

/** Logs the full error for operators; quota failures get a distinct log key. */
export function logPrismaDatabaseError(logKey: string, error: unknown): void {
  const classified = classifyPrismaDatabaseError(error);
  const context = {
    kind: classified.kind,
    sqlState: classified.sqlState,
    prismaCode:
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : undefined,
  };

  if (classified.kind === 'provider_quota_exceeded') {
    console.error(
      `[${logKey}] DATABASE_PROVIDER_QUOTA_EXCEEDED`,
      context,
      error,
    );
    return;
  }

  console.error(`[${logKey}]`, context, error);
}

export function userMessageForPrismaDatabaseError(
  error: unknown,
  fallback: string,
): string {
  const { kind } = classifyPrismaDatabaseError(error);
  if (kind === 'provider_quota_exceeded') {
    return 'خدمة قاعدة البيانات غير متاحة مؤقتاً. يرجى المحاولة لاحقاً.';
  }
  if (kind === 'database_unreachable') {
    return 'تعذر الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.';
  }
  return fallback;
}

export function httpStatusForPrismaDatabaseError(error: unknown): number {
  const { kind } = classifyPrismaDatabaseError(error);
  if (kind === 'provider_quota_exceeded' || kind === 'database_unreachable') {
    return 503;
  }
  return 500;
}