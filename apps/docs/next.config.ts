import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import { SECURITY_HEADERS, getCSPForEnvironment } from './src/lib/security';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Next.js 15 optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*', 'motion'],
  },
  
  // Optimize specific package imports
  transpilePackages: ['lucide-react'],
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers configuration
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Update CSP header with environment-specific settings
    const headers = SECURITY_HEADERS.map(header => {
      if (header.key === 'Content-Security-Policy') {
        return {
          ...header,
          value: getCSPForEnvironment(isDevelopment)
        };
      }
      return header;
    });
    
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers
      }
    ];
  }
};

const withMDX = createMDX({
  // Add markdown plugins here
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: {
            className: ['anchor'],
          },
        },
      ],
      rehypeHighlight,
    ],
  },
});

// Merge MDX config with Next.js config and bundle analyzer
export default withBundleAnalyzer(withMDX(nextConfig));
