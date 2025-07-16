import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { DocsLayout } from '@/components/docs/docs-layout';
import { getTocFromMdxContent } from '@/lib/toc';
import { readFile } from 'fs/promises';
import { join } from 'path';

const docs = {
  'getting-started': () => import('@/content/docs/getting-started.mdx'),
  'installation': () => import('@/content/docs/installation.mdx'),
  'api-reference': () => import('@/content/docs/api-reference.mdx'),
};

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = slug?.[0] || 'getting-started';
  
  const titles: Record<string, string> = {
    'getting-started': 'Getting Started',
    'installation': 'Installation',
    'api-reference': 'API Reference',
  };
  
  return {
    title: titles[page] || 'Documentation',
    description: `Learn about ${titles[page]?.toLowerCase() || 'next-unified-query'}`,
  };
}

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = slug?.[0] || 'getting-started';
  
  if (!docs[page as keyof typeof docs]) {
    notFound();
  }
  
  const { default: MDXContent } = await docs[page as keyof typeof docs]();
  
  // Generate TOC from MDX content
  let toc;
  try {
    const contentPath = join(process.cwd(), 'src', 'content', 'docs', `${page}.mdx`);
    const content = await readFile(contentPath, 'utf8');
    toc = getTocFromMdxContent(content);
  } catch (error) {
    console.warn(`Could not generate TOC for ${page}:`, error);
    toc = { items: [] };
  }
  
  return (
    <DocsLayout toc={toc}>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <MDXContent />
      </article>
    </DocsLayout>
  );
}

export function generateStaticParams() {
  return [
    { slug: ['getting-started'] },
    { slug: ['installation'] },
    { slug: ['api-reference'] },
  ];
}