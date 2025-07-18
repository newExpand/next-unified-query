import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();
  
  // Get pathname
  const pathname = request.nextUrl.pathname;
  
  // Security: Prevent access to sensitive files
  const sensitiveFiles = [
    '/.env',
    '/.git',
    '/package.json',
    '/tsconfig.json',
    '/.next',
    '/node_modules',
  ];
  
  if (sensitiveFiles.some(file => pathname.startsWith(file))) {
    return new NextResponse(null, { status: 404 });
  }
  
  // Add additional security headers not covered by next.config.ts
  // These are request-time headers that might need dynamic values
  
  // Add CSRF protection token (for forms if needed)
  const csrfToken = generateCSRFToken();
  response.headers.set('X-CSRF-Token', csrfToken);
  
  // Add request ID for logging and debugging
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);
  
  // Log security-relevant events
  if (process.env.NODE_ENV === 'production') {
    logSecurityEvent({
      type: 'request',
      requestId,
      path: pathname,
      method: request.method,
      ip: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Rate limiting headers (basic implementation)
  // In production, use a proper rate limiting service
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());
  
  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

// Helper function to generate CSRF token
function generateCSRFToken(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

// Helper function to log security events
function logSecurityEvent(event: {
  type: string;
  requestId: string;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}): void {
  // In production, send to logging service
  // For now, just console.log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Security Event]', JSON.stringify(event, null, 2));
  }
}