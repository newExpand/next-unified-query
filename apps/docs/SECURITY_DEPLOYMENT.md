# Security Configuration for Production Deployment

This document outlines the security configuration updates required after deploying to production.

## Environment Variables

Set the following environment variables in your production environment (e.g., Vercel):

```bash
# Required for production security configuration
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com

# Or let Vercel handle it automatically
# VERCEL_URL will be automatically set by Vercel
```

## Security Headers

The security configuration automatically adjusts based on the environment:

### Development
- Allows `localhost` connections
- Enables `unsafe-eval` for better developer experience
- Relaxed CSP for hot module replacement

### Production
- Strict Content Security Policy (CSP)
- Automatic HTTPS enforcement
- XSS and clickjacking protection
- Proper CSP reporting endpoint

## How It Works

1. **Dynamic URL Detection**:
   ```typescript
   // Priority order:
   1. NEXT_PUBLIC_SITE_URL (if explicitly set)
   2. VERCEL_URL (automatically set by Vercel)
   3. http://localhost:3001 (fallback for development)
   ```

2. **CSP Report URI**:
   - Automatically uses the production URL for CSP violation reports
   - Reports are sent to: `${siteUrl}/api/security/csp-report`

3. **Production-Specific CSP**:
   - Removes `unsafe-eval` from script sources
   - Adds Vercel analytics domains to `connect-src`
   - Configures proper image sources for production assets

## Testing Security Headers

### Local Testing
```bash
npm run test:security
```

### Production Testing
```bash
# Uses NEXT_PUBLIC_SITE_URL if set
npm run test:security:prod

# Or specify URL manually
TEST_URL=https://your-domain.com npm run test:security:prod
```

## Vercel Deployment

When deploying to Vercel:

1. **Automatic Configuration**:
   - Vercel automatically sets `VERCEL_URL`
   - Security headers adapt to the deployment URL

2. **Custom Domain**:
   - Set `NEXT_PUBLIC_SITE_URL` in Vercel dashboard
   - This ensures consistent URLs across all environments

3. **Preview Deployments**:
   - Each preview deployment gets unique security configuration
   - CSP report URIs automatically adjust to preview URLs

## Security Checklist

After deployment, verify:

- [ ] HTTPS is enforced (check for HSTS header)
- [ ] CSP is active (check browser console for violations)
- [ ] X-Frame-Options prevents clickjacking
- [ ] No `unsafe-eval` in production CSP
- [ ] CSP report endpoint is accessible
- [ ] External resources (fonts, analytics) load without CSP violations

## Monitoring

1. **CSP Violations**:
   - Monitor `/api/security/csp-report` endpoint
   - Review logs for policy violations
   - Adjust CSP directives as needed

2. **Security Headers**:
   - Use online tools to verify headers
   - Run security audits regularly
   - Monitor for new security best practices

## Troubleshooting

### Common Issues

1. **CSP Blocking Resources**:
   - Check browser console for CSP violations
   - Add trusted domains to appropriate CSP directives
   - Test changes in development first

2. **Missing Environment Variables**:
   - Verify `NEXT_PUBLIC_SITE_URL` is set in Vercel
   - Check build logs for environment variable warnings

3. **Report URI Not Working**:
   - Ensure `/api/security/csp-report` endpoint exists
   - Check for CORS issues if using custom domain
   - Verify production URL is correctly configured

## Updates After Domain Change

If you change your production domain:

1. Update `NEXT_PUBLIC_SITE_URL` in Vercel dashboard
2. Redeploy the application
3. Test security headers with new domain
4. Update any hardcoded URLs in documentation

## Additional Resources

- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Security Headers Best Practices](https://securityheaders.com/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)