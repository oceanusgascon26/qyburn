/**
 * Standardized API response utilities and validation helpers.
 * Provides consistent response shapes, input validation, pagination parsing,
 * and error-handling wrappers for all API routes.
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Response Wrappers ──────────────────────────────────────

/** Return a successful JSON response with optional status code. */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Return a paginated list response. */
export function apiList<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): NextResponse {
  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

/** Return an error response with message and optional status code. */
export function apiError(
  message: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse {
  const body: Record<string, unknown> = { error: message };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

// ─── Validation Helpers ─────────────────────────────────────

/** Validate that all required fields are present and non-empty in the body. */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || value === '') {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/** Validate a numeric value with optional min/max bounds. */
export function validateNumber(
  value: unknown,
  fieldName: string,
  opts?: { min?: number; max?: number }
): string | null {
  if (value === undefined || value === null) return null; // optional by default
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (opts?.min !== undefined && num < opts.min) {
    return `${fieldName} must be at least ${opts.min}`;
  }
  if (opts?.max !== undefined && num > opts.max) {
    return `${fieldName} must be at most ${opts.max}`;
  }
  return null;
}

/** Validate a value is one of the allowed enum values. */
export function validateEnum(
  value: unknown,
  fieldName: string,
  allowed: readonly string[]
): string | null {
  if (value === undefined || value === null) return null;
  if (!allowed.includes(value as string)) {
    return `${fieldName} must be one of: ${allowed.join(', ')}`;
  }
  return null;
}

/** Validate a string value with optional min/max length. */
export function validateString(
  value: unknown,
  fieldName: string,
  opts?: { minLength?: number; maxLength?: number }
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (opts?.minLength !== undefined && value.length < opts.minLength) {
    return `${fieldName} must be at least ${opts.minLength} characters`;
  }
  if (opts?.maxLength !== undefined && value.length > opts.maxLength) {
    return `${fieldName} must be at most ${opts.maxLength} characters`;
  }
  return null;
}

// ─── Pagination ─────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

/** Parse page and pageSize from query string with sensible defaults. */
export function parsePagination(
  request: NextRequest,
  defaults?: { page?: number; pageSize?: number; maxPageSize?: number }
): PaginationParams {
  const url = request.nextUrl;
  const defaultPage = defaults?.page ?? 1;
  const defaultPageSize = defaults?.pageSize ?? 25;
  const maxPageSize = defaults?.maxPageSize ?? 100;

  let page = parseInt(url.searchParams.get('page') ?? '', 10);
  if (isNaN(page) || page < 1) page = defaultPage;

  let pageSize = parseInt(url.searchParams.get('pageSize') ?? '', 10);
  if (isNaN(pageSize) || pageSize < 1) pageSize = defaultPageSize;
  if (pageSize > maxPageSize) pageSize = maxPageSize;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

// ─── Error Handler Wrapper ──────────────────────────────────

type ApiHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wraps an API handler with try-catch error handling.
 * Logs the error and returns a 500 response on unhandled exceptions.
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[API Error] ${request.method} ${request.nextUrl.pathname}: ${message}`,
        error
      );
      return apiError('Internal server error', 500);
    }
  };
}
