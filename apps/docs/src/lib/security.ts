/**
 * Security configuration for the documentation site
 */

// CSP directive values type
type CSPDirectiveValue = string[];

// Content Security Policy directives
export const CSP_DIRECTIVES: Record<string, CSPDirectiveValue> = {
  // Default policy for all resource types
  'default-src': ["'self'"],
  
  // Script sources - allow self, inline scripts for Next.js, and CDN for libraries
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Next.js development
    "'unsafe-inline'", // Required for Next.js hydration
    "https://cdn.jsdelivr.net", // For external libraries if needed
  ],
  
  // Style sources - allow self and inline styles for styled components
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
  ],
  
  // Image sources
  'img-src': [
    "'self'",
    "data:", // For base64 images
    "https:", // Allow images from HTTPS sources
    "blob:", // For blob URLs
  ],
  
  // Font sources
  'font-src': [
    "'self'",
    "data:", // For inline fonts
  ],
  
  // Connect sources for API calls
  'connect-src': [
    "'self'",
    "https://api.github.com", // For GitHub API if needed
    "https://raw.githubusercontent.com", // For raw GitHub content
  ],
  
  // Media sources
  'media-src': ["'self'"],
  
  // Object sources (plugins, embeds) - disabled for security
  'object-src': ["'none'"],
  
  // Frame sources - disabled to prevent iframe embedding
  'frame-src': ["'none'"],
  
  // Base URI to restrict <base> tag
  'base-uri': ["'self'"],
  
  // Form action destinations
  'form-action': ["'self'"],
  
  // Ancestors that can embed this page - none for clickjacking protection
  'frame-ancestors': ["'none'"],
  
  // Block all mixed content
  'block-all-mixed-content': [],
  
  // Upgrade insecure requests to HTTPS
  'upgrade-insecure-requests': [],
  
  // Report violations to our endpoint
  'report-uri': ['/api/security/csp-report'],
};

// Convert CSP directives object to string
export function generateCSP(directives: typeof CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

// Security headers configuration
export const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Content-Security-Policy',
    value: generateCSP(CSP_DIRECTIVES)
  }
];

// Environment-specific CSP modifications
export function getCSPForEnvironment(isDevelopment: boolean): string {
  const directives = { ...CSP_DIRECTIVES };
  
  if (isDevelopment) {
    // Add localhost for development
    directives['connect-src'] = [
      ...directives['connect-src'],
      "http://localhost:*",
      "ws://localhost:*", // For Next.js hot reload
    ];
    
    // Allow eval in development for better DX
    directives['script-src'] = [
      ...directives['script-src'],
      "'unsafe-eval'",
    ];
  } else {
    // Remove unsafe-eval in production
    directives['script-src'] = directives['script-src'].filter(
      src => src !== "'unsafe-eval'"
    );
  }
  
  return generateCSP(directives);
}

// Nonce generation for inline scripts (if needed in the future)
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}