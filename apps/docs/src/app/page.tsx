import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Zap, Shield, Code } from "lucide-react";
import Link from "next/link";
import { TypingText } from "@/components/animate-ui/text/typing";
import { GradientText } from "@/components/animate-ui/text/gradient";
import { SplittingText } from "@/components/animate-ui/text/splitting";
import {
  MotionHighlight,
  MotionHighlightItem,
} from "@/components/animate-ui/effects/motion-highlight";
import { MotionEffect } from "@/components/animate-ui/effects/motion-effect";
import { StarsBackground } from "@/components/animate-ui/backgrounds/stars";
import { GradientBackground } from "@/components/animate-ui/backgrounds/gradient";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">next-unified-query</span>
            </div>
            <div className="flex items-center space-x-6">
              <MotionHighlight
                mode="parent"
                controlledItems={true}
                hover={true}
                className="bg-primary/30 rounded-md"
                containerClassName="flex items-center space-x-0"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  duration: 0.2,
                }}
                exitDelay={0}
              >
                <MotionHighlightItem value="docs">
                  <Link
                    href="/docs/getting-started"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-md"
                  >
                    Docs
                  </Link>
                </MotionHighlightItem>
                <MotionHighlightItem value="examples">
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-md"
                  >
                    Examples
                  </a>
                </MotionHighlightItem>
                <MotionHighlightItem value="api">
                  <Link
                    href="/docs/api-reference"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-md"
                  >
                    API
                  </Link>
                </MotionHighlightItem>
              </MotionHighlight>
              <Button size="sm">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <StarsBackground
          className="absolute inset-0"
          starColor="#5e6ad2"
          factor={0.0005}
          pointerEvents={false}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                <TypingText text="Type-safe data fetching" />
              </span>
              <br />
              <GradientText
                text="for Next.js"
                className="text-foreground"
                gradient="linear-gradient(90deg, #5e6ad2 0%, #a855f7 50%, #5e6ad2 100%)"
                transition={{ duration: 1.5, repeat: 0, ease: "easeInOut" }}
              />
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-muted-foreground">
              A powerful TypeScript library that provides unified query management, automatic caching, and seamless integration with Next.js applications.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                View Examples
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24 sm:py-32">
        <GradientBackground className="absolute inset-0" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything you need to build modern apps
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features built for developer experience and performance
            </p>
          </div>

          <MotionEffect
            inView={true}
            slide={{ direction: "up", offset: 30 }}
            fade={{ initialOpacity: 0, opacity: 1 }}
            delay={0.2}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-border/10 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Lightning Fast</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Optimized caching strategies and intelligent query
                    management ensure your app stays fast and responsive.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/10 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Type Safe</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Built with TypeScript from the ground up. Get full type
                    safety and IntelliSense support out of the box.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/10 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Code className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Developer Experience</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Intuitive API design and comprehensive documentation make it
                    easy to build and maintain your applications.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/10 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Unified Queries</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Manage all your data fetching needs with a single, powerful
                    query system that works across your entire application.
                  </p>
                </CardContent>
              </Card>
            </div>
          </MotionEffect>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 border-t border-border/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already building better apps with next-unified-query
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Read Documentation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg">
              View on GitHub
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
