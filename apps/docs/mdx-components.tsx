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
    a: ({ href = '#', ...props }) => (
      <Link 
        href={href} 
        className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        {...props}
      />
    ),
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
    code: (props) => (
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props} />
    ),
    pre: (props) => (
      <pre className="mb-4 mt-6 overflow-x-auto rounded-lg bg-muted p-4" {...props} />
    ),
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