# Deployment and Operations Guide

## Table of Contents

1. [Overview](#overview)
2. [Documentation Site Deployment](#documentation-site-deployment)
3. [Library Publishing](#library-publishing)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring and Analytics](#monitoring-and-analytics)
7. [Performance Optimization](#performance-optimization)
8. [Security Configuration](#security-configuration)
9. [Maintenance Procedures](#maintenance-procedures)
10. [Troubleshooting Deployment Issues](#troubleshooting-deployment-issues)

## Overview

This guide covers deployment procedures for both the next-unified-query library packages and the documentation site.

### Components to Deploy

1. **NPM Packages**
   - `next-unified-query` (core library)
   - `next-unified-query-react` (React integration)

2. **Documentation Site**
   - Next.js 15 application
   - Deployed to Vercel
   - Custom domain configuration

## Documentation Site Deployment

### Prerequisites

- Vercel account
- GitHub repository access
- Domain name (optional)

### Vercel Deployment Setup

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link project
   cd apps/docs
   vercel link
   ```

2. **Configure Build Settings**
   ```json
   // vercel.json
   {
     "buildCommand": "cd ../.. && pnpm build:docs",
     "outputDirectory": "apps/docs/.next",
     "installCommand": "pnpm install",
     "framework": "nextjs",
     "regions": ["iad1"],
     "functions": {
       "apps/docs/src/app/api/security/csp-report/route.ts": {
         "maxDuration": 10
       }
     }
   }
   ```

3. **Environment Variables**
   ```bash
   # Production environment variables
   NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
   NEXT_PUBLIC_ALGOLIA_API_KEY=your_search_key
   NEXT_PUBLIC_ALGOLIA_INDEX_NAME=docs
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   VERCEL_URL=$VERCEL_URL
   NODE_ENV=production
   ```

### Manual Deployment

```bash
# Production deployment
vercel --prod

# Preview deployment
vercel

# Deploy specific branch
vercel --prod --scope your-team
```

### Automatic Deployment

Vercel automatically deploys:
- **Production**: On push to `main` branch
- **Preview**: On pull requests

## Library Publishing

### Prerequisites

- NPM account with publish access
- Clean working directory
- All tests passing

### Pre-publish Checklist

```bash
# 1. Ensure clean working directory
git status

# 2. Run all tests
pnpm test
pnpm test:types
pnpm test:e2e

# 3. Build packages
pnpm build

# 4. Update version
pnpm changeset

# 5. Update changelog
pnpm changeset version
```

### Publishing Process

1. **Manual Publishing**
   ```bash
   # Login to npm
   npm login
   
   # Publish all packages
   pnpm publish -r
   
   # Or publish individually
   cd packages/next-unified-query
   npm publish
   
   cd ../next-unified-query-react
   npm publish
   ```

2. **Automated Publishing (Recommended)**
   ```yaml
   # .github/workflows/release.yml
   name: Release
   
   on:
     push:
       branches:
         - main
   
   jobs:
     release:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: pnpm/action-setup@v2
         - uses: actions/setup-node@v3
           with:
             node-version: 18
             cache: 'pnpm'
         
         - run: pnpm install
         - run: pnpm build
         - run: pnpm test
         
         - name: Create Release Pull Request or Publish
           uses: changesets/action@v1
           with:
             publish: pnpm release
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

### Version Management

```bash
# Create changeset for version bump
pnpm changeset

# Select packages to update
# Choose version type (patch/minor/major)
# Write changelog entry

# Apply version changes
pnpm changeset version

# Commit changes
git add .
git commit -m "chore: version packages"
```

## CI/CD Pipeline

### GitHub Actions Configuration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:types

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: packages/*/dist

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm test:e2e
```

### Branch Protection Rules

Configure on GitHub:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Include administrators

## Environment Configuration

### Development Environment

```env
# .env.development
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### Production Environment

```env
# .env.production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://docs.example.com
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_API_KEY=your_search_key
```

### Environment Variable Management

```typescript
// lib/env.ts
const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://docs.example.com',
  algolia: {
    appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    apiKey: process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!,
    indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'docs'
  }
} as const;

// Validate required variables
if (!env.algolia.appId || !env.algolia.apiKey) {
  throw new Error('Missing required Algolia configuration');
}

export { env };
```

## Monitoring and Analytics

### Vercel Analytics Setup

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Performance Monitoring

```typescript
// lib/monitoring.ts
export function reportWebVitals(metric: any) {
  // Send to analytics
  if (metric.label === 'web-vital') {
    console.log(metric);
    
    // Send to your analytics service
    window.gtag?.('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}
```

### Error Tracking (Optional)

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export function trackError(error: Error, context?: any) {
  console.error(error);
  Sentry.captureException(error, { extra: context });
}
```

## Performance Optimization

### Build Optimization

```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  experimental: {
    optimizeCss: true,
  },
  
  webpack: (config, { isServer }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        })
      );
    }
    
    return config;
  },
};
```

### Caching Strategy

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Cache static assets
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }
  
  // Cache images
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=86400, must-revalidate'
    );
  }
  
  return response;
}
```

## Security Configuration

### Production Security Headers

```typescript
// Update after deployment with production URL
// apps/docs/src/lib/security.ts

export const updateProductionConfig = (productionUrl: string) => {
  // Update CSP report-uri
  const cspHeader = securityHeaders['Content-Security-Policy'];
  const updatedCSP = cspHeader.replace(
    'http://localhost:3001/api/security/csp-report',
    `${productionUrl}/api/security/csp-report`
  );
  
  return {
    ...securityHeaders,
    'Content-Security-Policy': updatedCSP
  };
};
```

### SSL/TLS Configuration

Vercel automatically provides:
- SSL certificates
- Automatic renewal
- HTTPS enforcement

For custom domains:
1. Add domain in Vercel dashboard
2. Update DNS records
3. Wait for SSL provisioning

## Maintenance Procedures

### Regular Tasks

1. **Weekly**
   - Check for dependency updates
   - Review error logs
   - Monitor performance metrics

2. **Monthly**
   - Run full security audit
   - Update dependencies
   - Review and optimize bundle size

3. **Quarterly**
   - Major dependency updates
   - Performance audit
   - Documentation review

### Update Procedures

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Update specific package
pnpm update package-name

# Interactive update
pnpm update -i

# After updates
pnpm test
pnpm build
```

### Rollback Procedures

1. **Vercel Rollback**
   ```bash
   # List deployments
   vercel ls
   
   # Rollback to specific deployment
   vercel rollback [deployment-url]
   ```

2. **NPM Package Rollback**
   ```bash
   # Deprecate broken version
   npm deprecate next-unified-query@1.2.3 "Critical bug, use 1.2.2"
   
   # Publish previous version as latest
   cd packages/next-unified-query
   npm publish --tag latest
   ```

## Troubleshooting Deployment Issues

### Common Vercel Issues

1. **Build Failures**
   ```bash
   # Check build logs
   vercel logs [deployment-url]
   
   # Run build locally
   vercel build
   ```

2. **Environment Variable Issues**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure proper scoping (preview/production)

3. **Domain Configuration**
   - Verify DNS records
   - Check SSL certificate status
   - Test with `dig` or `nslookup`

### NPM Publishing Issues

1. **Authentication Errors**
   ```bash
   # Re-authenticate
   npm logout
   npm login
   
   # Check authentication
   npm whoami
   ```

2. **Version Conflicts**
   ```bash
   # Check published versions
   npm view next-unified-query versions
   
   # Force publish (use carefully)
   npm publish --force
   ```

3. **Package Size Issues**
   ```bash
   # Check package size
   npm pack --dry-run
   
   # Review included files
   npm publish --dry-run
   ```

### Performance Issues

1. **Slow Build Times**
   - Enable build caching
   - Optimize dependencies
   - Use incremental builds

2. **Large Bundle Size**
   ```bash
   # Analyze bundle
   ANALYZE=true pnpm build
   
   # Review report
   open apps/docs/.next/analyze/client.html
   ```

3. **Runtime Performance**
   - Check Core Web Vitals
   - Review server response times
   - Optimize image loading

## Support and Escalation

### Getting Help

1. **Vercel Support**: support@vercel.com
2. **GitHub Issues**: Report deployment issues
3. **Community**: Discord/Slack channels

### Emergency Procedures

1. **Site Down**
   - Check Vercel status page
   - Review recent deployments
   - Rollback if necessary

2. **Security Incident**
   - Rotate compromised credentials
   - Review access logs
   - Update security headers

3. **Performance Crisis**
   - Enable maintenance mode
   - Scale resources
   - Implement emergency caching

---

For additional help, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NPM Publishing](https://docs.npmjs.com/cli/publish)