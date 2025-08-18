import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Customize built-in components
    h1: (props) => (
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl mb-4" {...props} />
    ),
    h2: (props) => (
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4" {...props} />
    ),
    h3: (props) => (
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4" {...props} />
    ),
    h4: (props) => (
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4" {...props} />
    ),
    p: (props) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6 mb-4" {...props} />
    ),
    a: ({ href = '#', ...props }) => {
      const { ref, ...linkProps } = props;
      return (
        <Link 
          href={href} 
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          {...linkProps}
        />
      );
    },
    ul: (props) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
    ),
    ol: (props) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
    ),
    li: (props) => (
      <li className="leading-7" {...props} />
    ),
    blockquote: (props) => (
      <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />
    ),
    code: ({ className, ...props }) => {
      // Inline code styling
      const isInline = !className?.includes('language-');
      if (isInline) {
        return (
          <code 
            className="bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-mono text-sm border" 
            {...props} 
          />
        );
      }
      // Code block code styling (handled by pre)
      return <code className={className} {...props} />;
    },
    pre: ({ children, ...props }) => {
      // Extract language from code element
      const codeElement = children as any;
      const className = codeElement?.props?.className || '';
      const language = className.replace('language-', '');
      
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 shadow-lg">
          <pre className="text-sm font-mono text-slate-100 overflow-x-auto" {...props}>
            <code className={`language-${language}`}>
              {codeElement?.props?.children}
            </code>
          </pre>
        </div>
      );
    },
    table: (props) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full" {...props} />
      </div>
    ),
    th: (props) => (
      <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
    ),
    td: (props) => (
      <td className="border px-4 py-2 [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
    ),
    hr: () => (
      <hr className="my-4 md:my-8" />
    ),
    // Custom components
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    ...components,
  };
}