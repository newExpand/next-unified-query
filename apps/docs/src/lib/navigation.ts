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
    items: []
  },
  {
    title: "Core API",
    items: []
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