import { notFound } from 'next/navigation';
import { Metadata } from 'next';

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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <MDXContent />
        </article>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return [
    { slug: ['getting-started'] },
    { slug: ['installation'] },
    { slug: ['api-reference'] },
  ];
}