import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>Next Unified Query Examples</h1>
      
      <p className="mb-4">Clean, focused examples demonstrating the core features with the new simplified configuration system</p>
      
      <ul className="space-y-2">
        <li>
          <Link href="/examples/basic-query">
            Basic Query - Learn the fundamentals of useQuery hook
          </Link>
        </li>
        <li>
          <Link href="/examples/basic-mutation">
            Basic Mutation - Master the useMutation hook
          </Link>
        </li>
        <li>
          <Link href="/examples/ssr">
            SSR & RSC - Server-side rendering examples
          </Link>
        </li>
        <li>
          <Link href="/examples/factory">
            Factory Pattern - Type-safe API calls
          </Link>
        </li>
        <li>
          <Link href="/examples/interceptors">
            Interceptors - Request/response interceptors
          </Link>
        </li>
        <li>
          <Link href="/examples/error-boundary">
            Error Boundary - Error handling with React Error Boundaries
          </Link>
        </li>
      </ul>
    </div>
  );
}