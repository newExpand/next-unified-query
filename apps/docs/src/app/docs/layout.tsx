import Link from 'next/link';
import { Button } from '@/components/ui/button';

const navigation = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
  },
  {
    title: 'Installation',
    href: '/docs/installation',
  },
  {
    title: 'API Reference',
    href: '/docs/api-reference',
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              next-unified-query
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/docs/getting-started">
                <Button variant="ghost">Docs</Button>
              </Link>
              <Link href="https://github.com/your-org/next-unified-query" target="_blank">
                <Button variant="ghost">GitHub</Button>
              </Link>
            </nav>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Documentation</h2>
              <nav className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}