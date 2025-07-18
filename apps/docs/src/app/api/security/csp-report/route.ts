import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from '@/lib/security-monitoring';

// CSP violation report interface
interface CSPReport {
  'csp-report': {
    'blocked-uri'?: string;
    'document-uri': string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'referrer'?: string;
    'status-code'?: number;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse CSP report
    const report: CSPReport = await request.json();
    const cspReport = report['csp-report'];

    // Log the violation
    securityMonitor.logEvent({
      type: 'csp-violation',
      severity: 'medium',
      ip: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        blockedUri: cspReport['blocked-uri'],
        documentUri: cspReport['document-uri'],
        violatedDirective: cspReport['violated-directive'],
        effectiveDirective: cspReport['effective-directive'],
        originalPolicy: cspReport['original-policy'],
        referrer: cspReport.referrer,
        statusCode: cspReport['status-code'],
        sourceFile: cspReport['source-file'],
        lineNumber: cspReport['line-number'],
        columnNumber: cspReport['column-number'],
      },
    });

    // Return 204 No Content as per CSP reporting spec
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to process CSP report:', error);
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 400 }
    );
  }
}

// Also support GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'CSP reporting endpoint is active',
    endpoint: '/api/security/csp-report',
    method: 'POST',
  });
}