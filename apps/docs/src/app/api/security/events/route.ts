import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor, SecurityValidation } from '@/lib/security-monitoring';

// GET security events (for monitoring dashboard)
export async function GET(request: NextRequest) {
  try {
    // In production, add authentication check here
    // For now, only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let events = securityMonitor.getRecentEvents(limit);

    // Filter by type if specified
    if (type) {
      events = events.filter(event => event.type === type);
    }

    // Filter by severity if specified
    if (severity === 'high') {
      events = securityMonitor.getHighSeverityEvents();
    }

    return NextResponse.json({
      events,
      count: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch security events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST to log security events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input for security
    const input = JSON.stringify(body);
    if (SecurityValidation.containsXSS(input) || 
        SecurityValidation.containsSQLInjection(input) ||
        SecurityValidation.containsPathTraversal(input)) {
      
      // Log the suspicious attempt
      securityMonitor.logEvent({
        type: 'suspicious-request',
        severity: 'high',
        ip: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        path: '/api/security/events',
        method: 'POST',
        details: {
          reason: 'Malicious payload detected',
          payload: SecurityValidation.sanitizeInput(input).slice(0, 200),
        },
      });
      
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    // Log the event
    securityMonitor.logEvent(body);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}