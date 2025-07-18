export interface NavigationItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: string;
  label?: string;
  description?: string;
  items?: NavigationItem[];
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export const navigation: NavigationGroup[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Installation",
        href: "/docs/installation",
        description: "Get started with next-unified-query in your project"
      },
      {
        title: "Getting Started",
        href: "/docs/getting-started",
        description: "Learn the basics and create your first query"
      }
    ]
  },
  {
    title: "Core Concepts",
    items: [
      {
        title: "Query Builder",
        href: "/docs/query-builder",
        description: "Build type-safe queries with our fluent API"
      },
      {
        title: "Type Safety",
        href: "/docs/type-safety",
        description: "Leverage TypeScript for better development experience",
        items: [
          {
            title: "Overview",
            href: "/docs/type-safety/overview",
            description: "Type safety features and benefits"
          },
          {
            title: "Factory Patterns",
            href: "/docs/type-safety/factory-patterns",
            description: "Type-safe factory pattern usage"
          },
          {
            title: "HTTP Methods",
            href: "/docs/type-safety/http-methods",
            description: "HTTP method type safety"
          },
          {
            title: "Schema Validation",
            href: "/docs/type-safety/schema-validation",
            description: "Runtime validation with Zod"
          }
        ]
      },
      {
        title: "Caching",
        href: "/docs/caching",
        description: "Optimize performance with intelligent caching"
      }
    ]
  },
  {
    title: "Advanced",
    items: [
      {
        title: "Custom Hooks",
        href: "/docs/custom-hooks",
        description: "Create reusable query hooks for your application"
      },
      {
        title: "Error Handling",
        href: "/docs/error-handling",
        description: "Handle errors gracefully in your queries"
      },
      {
        title: "Performance",
        href: "/docs/performance",
        description: "Optimize your queries for better performance"
      }
    ]
  },
  {
    title: "API Reference",
    items: [
      {
        title: "API Overview",
        href: "/docs/api-reference",
        description: "Complete API documentation overview"
      },
      {
        title: "Core Hooks",
        href: "/docs/core-hooks",
        description: "useQuery, useMutation and other React hooks"
      },
      {
        title: "Providers & Context",
        href: "/docs/providers-and-context",
        description: "QueryClientProvider, HydrationBoundary and context APIs"
      },
      {
        title: "Core API",
        href: "/api-docs/globals",
        description: "Core functions and classes (TypeDoc)"
      },
      {
        title: "React Hooks",
        href: "/api-docs/functions",
        external: true,
        description: "React hooks documentation"
      },
      {
        title: "Type Definitions",
        href: "/api-docs/interfaces",
        external: true,
        description: "TypeScript interfaces and types"
      },
      {
        title: "Configuration",
        href: "/docs/configuration",
        description: "Configure next-unified-query for your needs"
      },
      {
        title: "Migration Guide",
        href: "/docs/migration",
        description: "Migrate from other query libraries"
      }
    ]
  }
];

export function getNavigationFromSlug(slug: string[]): NavigationItem | null {
  const path = `/docs/${slug.join('/')}`;
  
  for (const group of navigation) {
    for (const item of group.items) {
      if (item.href === path) {
        return item;
      }
      if (item.items) {
        for (const subItem of item.items) {
          if (subItem.href === path) {
            return subItem;
          }
        }
      }
    }
  }
  
  return null;
}

export function getPreviousNext(currentPath: string) {
  const allItems: NavigationItem[] = [];
  
  // Flatten all navigation items
  navigation.forEach(group => {
    group.items.forEach(item => {
      if (item.href) {
        allItems.push(item);
      }
      if (item.items) {
        item.items.forEach(subItem => {
          if (subItem.href) {
            allItems.push(subItem);
          }
        });
      }
    });
  });
  
  const currentIndex = allItems.findIndex(item => item.href === currentPath);
  
  return {
    previous: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null
  };
}