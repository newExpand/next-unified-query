# Security Configuration

This document outlines the security measures implemented in the next-unified-query documentation site.

## Security Headers

The following security headers are configured for all routes:

### 1. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- Forces HTTPS connections for 2 years
- Includes all subdomains
- Eligible for browser preload lists

### 2. X-Frame-Options
```
X-Frame-Options: DENY
```
- Prevents the site from being embedded in iframes
- Protects against clickjacking attacks

### 3. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- Prevents browsers from MIME-sniffing
- Forces browsers to respect the declared Content-Type

### 4. Referrer-Policy
```
Referrer-Policy: origin-when-cross-origin
```
- Controls how much referrer information is shared
- Sends full URL for same-origin, only origin for cross-origin

### 5. Permissions-Policy
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```
- Disables unused browser features
- Reduces attack surface

## Content Security Policy (CSP)

The CSP is configured to prevent XSS and other injection attacks:

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https://api.github.com https://raw.githubusercontent.com;
media-src 'self';
object-src 'none';
frame-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
block-all-mixed-content;
upgrade-insecure-requests;
report-uri /api/security/csp-report;
```

### CSP Notes:
- `unsafe-inline` and `unsafe-eval` are required for Next.js and styled components
- In production, consider using nonces for inline scripts
- CSP violations are reported to `/api/security/csp-report`

## Security Monitoring

### 1. CSP Violation Reporting
- Violations are automatically reported to `/api/security/csp-report`
- Logged with severity levels and details
- Available for review in development mode

### 2. Request Logging
- All requests include unique request IDs
- Security-relevant events are logged
- Suspicious patterns are detected and logged

### 3. Input Validation
- XSS pattern detection
- SQL injection pattern detection
- Path traversal detection
- Automatic input sanitization

## Middleware Security

The middleware implements additional security measures:

1. **Sensitive File Protection**: Blocks access to:
   - `.env` files
   - `.git` directory
   - `package.json`
   - `tsconfig.json`
   - `.next` directory
   - `node_modules`

2. **CSRF Protection**: Generates tokens for form submissions

3. **Rate Limiting**: Basic rate limiting headers (implement proper service in production)

## API Security

### Security Event Endpoints

1. **CSP Report Endpoint**: `/api/security/csp-report`
   - Receives and logs CSP violations
   - Returns 204 No Content as per spec

2. **Security Events Endpoint**: `/api/security/events`
   - GET: Retrieve security events (dev only)
   - POST: Log security events

## Environment Variables

Configure security settings via environment variables:

```env
# Enable strict CSP in development
NEXT_PUBLIC_ENABLE_STRICT_CSP=false

# Allowed external domains
NEXT_PUBLIC_ALLOWED_DOMAINS=cdn.jsdelivr.net,api.github.com

# Security monitoring endpoint
SECURITY_MONITORING_ENDPOINT=

# Rate limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# CORS origins
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Development vs Production

### Development Mode
- Relaxed CSP for hot reload
- Security event logging to console
- Access to security monitoring endpoints

### Production Mode
- Strict CSP enforcement
- Security events sent to monitoring service
- Monitoring endpoints restricted
- No unsafe-eval in CSP

## Security Best Practices

1. **Regular Updates**: Keep dependencies updated
2. **Dependency Scanning**: Use npm audit regularly
3. **Input Validation**: Always validate and sanitize user input
4. **HTTPS Only**: Never deploy without HTTPS
5. **Environment Variables**: Never commit sensitive data
6. **Error Handling**: Don't expose stack traces in production

## Testing Security

To test the security configuration:

1. **Check Headers**:
   ```bash
   curl -I https://your-domain.com
   ```

2. **Test CSP**:
   - Open browser DevTools
   - Check Console for CSP violations
   - Review Network tab for blocked resources

3. **Security Scan**:
   ```bash
   npm audit
   ```

4. **OWASP ZAP**: Run security scans with OWASP ZAP

## Incident Response

If a security issue is detected:

1. Check `/api/security/events` for details
2. Review server logs
3. Check CSP violation reports
4. Update security configuration as needed
5. Document the incident

## Contact

For security concerns, contact: security@your-domain.com