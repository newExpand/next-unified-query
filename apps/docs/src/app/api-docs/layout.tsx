import { DocsLayout } from '@/components/docs/docs-layout';

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsLayout>
      {children}
    </DocsLayout>
  );
}