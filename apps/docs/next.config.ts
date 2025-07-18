import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import { SECURITY_HEADERS, getCSPForEnvironment } from './src/lib/security';

const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  
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

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
