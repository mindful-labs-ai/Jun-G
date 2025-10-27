import { NextResponse } from 'next/server';

export function createErrorResponse(
  message: string,
  status: number,
  error?: unknown
): NextResponse {
  const response: { error: string; details?: string } = { error: message };

  if (error instanceof Error) {
    response.details = error.message;
  }

  return NextResponse.json(response, { status });
}

export function unauthorized(): NextResponse {
  return createErrorResponse('Unauthorized', 401);
}

export function forbidden(): NextResponse {
  return createErrorResponse('Forbidden', 403);
}

export function notFound(resource: string = 'Resource'): NextResponse {
  return createErrorResponse(`${resource} not found`, 404);
}

export function badRequest(message: string): NextResponse {
  return createErrorResponse(message, 400);
}

export function internalError(message: string, error?: unknown): NextResponse {
  if (error) {
    console.error(message, error);
  }
  return createErrorResponse(message, 500, error);
}
