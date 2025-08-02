'use client';

// Re-export existing shadcn/ui components
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Alert, AlertDescription, AlertTitle } from './alert';

// MDX specific components
import { cn } from '@/lib/utils';
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Card } from './card';
import { LucideIcon, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';

// Callout component (based on Alert)
interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}

const calloutConfig: Record<string, { icon: LucideIcon; className: string }> = {
  info: {
    icon: Info,
    className: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  warning: {
    icon: AlertCircle,
    className: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
  },
  error: {
    icon: XCircle,
    className: 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
  }
};

export function Callout({ type = 'info', title, children, className, ...props }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <Alert className={cn(config.className, className)} {...props}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

// Cards component (wrapper for multiple cards)
interface CardsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Cards({ children, className, ...props }: CardsProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)} {...props}>
      {children}
    </div>
  );
}

// Code component (inline code)
interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Code({ children, className, ...props }: CodeProps) {
  return (
    <code
      className={cn(
        'relative rounded bg-gray-100 px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium dark:bg-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}

// Pre component (code blocks)
interface PreProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
}

export function Pre({ children, className, ...props }: PreProps) {
  return (
    <pre
      className={cn(
        'mb-4 mt-6 overflow-x-auto rounded-lg bg-gray-900 p-4 dark:bg-gray-950',
        className
      )}
      {...props}
    >
      <code className="relative rounded bg-transparent px-0 py-0 font-mono text-sm text-gray-100">
        {children}
      </code>
    </pre>
  );
}

// Enhanced Card for MDX (with hover effects matching Linear style)
interface MDXCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  href?: string;
  children?: React.ReactNode;
}

export function MDXCard({ title, description, href, children, className, ...props }: MDXCardProps) {
  const Comp = href ? 'a' : 'div';
  
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'hover:shadow-lg hover:shadow-gray-500/10 dark:hover:shadow-gray-800/10',
        'hover:border-gray-300 dark:hover:border-gray-700',
        href && 'cursor-pointer',
        className
      )}
      {...props}
    >
      <Comp
        href={href}
        className={cn(
          'block p-6',
          href && 'no-underline'
        )}
      >
        <div className="space-y-2">
          <h3 className="font-semibold leading-tight">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
          {children}
        </div>
      </Comp>
    </Card>
  );
}

// Re-export MDXCard as Card for MDX usage
export { MDXCard as CardMDX };