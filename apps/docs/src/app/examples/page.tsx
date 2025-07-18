import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
        
        <h1 className="text-4xl font-bold mb-6" style={{ fontSize: "2.25rem" }}>Examples</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Explore practical examples of next-unified-query in action.
        </p>
        
        <div className="prose prose-invert max-w-none">
          <p>Examples coming soon...</p>
          <p>Check out our <Link href="/docs/getting-started" className="text-primary hover:underline">Getting Started guide</Link> for basic usage examples.</p>
        </div>
        
        <div className="mt-12">
          <Button asChild>
            <Link href="/docs/getting-started">
              View Documentation
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}