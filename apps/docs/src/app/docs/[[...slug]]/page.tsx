import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { DocsLayout } from '@/components/docs/docs-layout';
import { getTocFromMdxContent } from '@/lib/toc';
import { readFile } from 'fs/promises';
import { join } from 'path';

const docs = {
  'installation': () => import('@/content/docs/installation.mdx'),
};

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = slug?.[0] || 'installation';
  
  const titles: Record<string, string> = {
    'installation': 'Installation',
  };
  
  return {
    title: titles[page] || 'Documentation',
    description: `Learn about ${titles[page]?.toLowerCase() || 'next-unified-query'}`,
  };
}

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = slug?.[0] || 'installation';
  
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
      <article className="max-w-none">
        <MDXContent />
      </article>
    </DocsLayout>
  );
}

export function generateStaticParams() {
  return [
    { slug: ['installation'] },
  ];
}