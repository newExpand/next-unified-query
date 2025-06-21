import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Integration Test Demo</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Real-world Scenarios</h2>
          <div className="space-y-2">
            <Link href="/users" className="block text-blue-600 hover:underline">
              Users List → Detail Navigation
            </Link>
            <Link href="/posts" className="block text-blue-600 hover:underline">
              Posts with Pagination
            </Link>
            <Link href="/client-stale-test" className="block text-blue-600 hover:underline">
              StaleTime Test
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Next.js Features</h2>
          <div className="space-y-2">
            <Link href="/users/1" className="block text-blue-600 hover:underline">
              Server Component Prefetch
            </Link>
            <Link href="/dashboard" className="block text-blue-600 hover:underline">
              Mixed Server/Client Components
            </Link>
            <Link href="/fetch-cache-test" className="block text-blue-600 hover:underline">
              App Router Cache Test
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Performance Tests</h2>
          <div className="space-y-2">
            <Link href="/stress-test/queries" className="block text-blue-600 hover:underline">
              Memory Usage Test
            </Link>
            <Link href="/performance/concurrent-queries" className="block text-blue-600 hover:underline">
              Concurrent Queries
            </Link>
            <Link href="/components/dynamic" className="block text-blue-600 hover:underline">
              Dynamic Components
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">State Sharing</h2>
          <div className="space-y-2">
            <Link href="/state-sharing/multiple-components" className="block text-blue-600 hover:underline">
              Multiple Components
            </Link>
            <Link href="/state-sharing/mutation-invalidation" className="block text-blue-600 hover:underline">
              Mutation Invalidation
            </Link>
            <Link href="/state-sharing/optimistic-updates" className="block text-blue-600 hover:underline">
              Optimistic Updates
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}