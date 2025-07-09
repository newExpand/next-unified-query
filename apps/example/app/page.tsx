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
            <Link
              href="/client-stale-test"
              className="block text-blue-600 hover:underline"
            >
              StaleTime Test
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Next.js Features</h2>
          <div className="space-y-2">
            <Link
              href="/users/1"
              className="block text-blue-600 hover:underline"
            >
              Server Component Prefetch
            </Link>
            <Link
              href="/dashboard"
              className="block text-blue-600 hover:underline"
            >
              Mixed Server/Client Components
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Performance Tests</h2>
          <div className="space-y-2">
            <Link
              href="/stress-test/queries"
              className="block text-blue-600 hover:underline"
            >
              Memory Usage Test
            </Link>
            <Link
              href="/performance/concurrent-queries"
              className="block text-blue-600 hover:underline"
            >
              Concurrent Queries
            </Link>
            <Link
              href="/components/dynamic"
              className="block text-blue-600 hover:underline"
            >
              Dynamic Components
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">State Sharing</h2>
          <div className="space-y-2">
            <Link
              href="/state-sharing/multiple-components"
              className="block text-blue-600 hover:underline"
            >
              Multiple Components
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Conditional Queries</h2>
          <div className="space-y-2">
            <Link
              href="/dependent-queries/address-form"
              className="block text-blue-600 hover:underline"
            >
              Address Form (Dependent Queries)
            </Link>
            <Link
              href="/conditional-routing/project/1?view=overview"
              className="block text-blue-600 hover:underline"
            >
              Project Routing (URL Parameters)
            </Link>
            <Link
              href="/dependent-queries/product-selector"
              className="block text-blue-600 hover:underline"
            >
              Product Selector (Query Chain)
            </Link>
            <Link
              href="/conditional-tabs/lazy-loading"
              className="block text-blue-600 hover:underline"
            >
              Lazy Loading Tabs
            </Link>
            <Link
              href="/conditional-modals/user-management"
              className="block text-blue-600 hover:underline"
            >
              User Management Modals
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Cache Comparison</h2>
          <div className="space-y-2">
            <Link
              href="/force-cache-page"
              className="block text-blue-600 hover:underline"
            >
              next-unified-query Cache
            </Link>
            <Link
              href="/tanstack-test-3"
              className="block text-blue-600 hover:underline"
            >
              TanStack React Query Cache
            </Link>
            <Link
              href="/debug-cache-page"
              className="block text-blue-600 hover:underline"
            >
              Debug Cache Behavior
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
