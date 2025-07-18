/**
 * Security monitoring and logging utilities
 */

// Security event types
export type SecurityEventType = 
  | 'csp-violation'
  | 'rate-limit-exceeded'
  | 'suspicious-request'
  | 'authentication-failure'
  | 'authorization-failure'
  | 'xss-attempt'
  | 'sql-injection-attempt'
  | 'path-traversal-attempt';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  details?: Record<string, unknown>;
}

// Security monitoring class
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Add to in-memory store (for development)
    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Log based on severity
    this.logToConsole(fullEvent);

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(fullEvent);
    }
  }

  private logToConsole(event: SecurityEvent): void {
    const prefix = `[Security ${event.severity.toUpperCase()}]`;
    const message = `${prefix} ${event.type}: ${JSON.stringify(event, null, 2)}`;

    switch (event.severity) {
      case 'critical':
      case 'high':
        console.error(message);
        break;
      case 'medium':
        console.warn(message);
        break;
      default:
        console.log(message);
    }
  }

  private async sendToMonitoringService(_event: SecurityEvent): Promise<void> {
    // Implement integration with monitoring service
    // Examples: Sentry, DataDog, CloudWatch, etc.
    try {
      // await fetch('/api/security/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
    } catch (error) {
      console.error('Failed to send security event to monitoring service:', error);
    }
  }

  getRecentEvents(count = 100): SecurityEvent[] {
    return this.events.slice(0, count);
  }

  getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  getHighSeverityEvents(): SecurityEvent[] {
    return this.events.filter(
      event => event.severity === 'high' || event.severity === 'critical'
    );
  }
}

// Request validation utilities
export const SecurityValidation = {
  // Check for common XSS patterns
  containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*onerror\s*=/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  },

  // Check for SQL injection patterns
  containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create)\b[\s\S]*\b(from|where|table)\b)/gi,
      /(';|";|--;|\/\*|\*\/)/g,
      /(\bor\b\s*\d+\s*=\s*\d+)/gi,
      /(\band\b\s*\d+\s*=\s*\d+)/gi,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // Check for path traversal attempts
  containsPathTraversal(input: string): boolean {
    const pathPatterns = [
      /\.\.[\/\\]/g,
      /\.\.%2[fF]/g,
      /\.\.%5[cC]/g,
      /%2[eE]%2[eE]/g,
    ];

    return pathPatterns.some(pattern => pattern.test(input));
  },

  // Validate and sanitize input
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  },
};

// CSP violation reporter
export function setupCSPReporting(): void {
  if (typeof window === 'undefined') return;

  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    const monitor = SecurityMonitor.getInstance();
    
    monitor.logEvent({
      type: 'csp-violation',
      severity: 'medium',
      details: {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
      },
    });
  });
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();