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
        description: "Get started with next-unified-query"
      },
      {
        title: "Getting Started",
        href: "/docs/getting-started",
        description: "Quick start guide and basic usage"
      }
    ]
  },
  {
    title: "API Reference",
    items: [
      {
        title: "Core API",
        href: "/api-docs/globals",
        description: "Complete API reference and documentation"
      },
      {
        title: "Classes",
        href: "/api-docs/classes",
        description: "QueryClient, FetchError, and other classes"
      },
      {
        title: "Functions",
        href: "/api-docs/functions",
        description: "createQueryFactory, ssrPrefetch, and utility functions"
      },
      {
        title: "Interfaces",
        href: "/api-docs/interfaces",
        description: "Type definitions and configuration interfaces"
      },
      {
        title: "Type Aliases",
        href: "/api-docs/type-aliases",
        description: "Type aliases and utility types"
      },
      {
        title: "Variables",
        href: "/api-docs/variables",
        description: "HTTP methods and global variables"
      },
      {
        title: "Enumerations",
        href: "/api-docs/enumerations",
        description: "Enum definitions and constants"
      }
    ]
  },
  {
    title: "Guides",
    items: []
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