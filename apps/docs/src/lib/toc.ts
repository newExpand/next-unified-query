export interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

export interface TocTree {
  items: TocItem[];
}

export function extractTocFromContent(content: string): TocTree {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const items: TocItem[] = [];
  const idCountMap = new Map<string, number>();
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const baseId = generateId(title);
    
    // Handle duplicate IDs by appending a counter
    let id = baseId;
    const count = idCountMap.get(baseId) || 0;
    if (count > 0) {
      id = `${baseId}-${count}`;
    }
    idCountMap.set(baseId, count + 1);
    
    items.push({
      id,
      title,
      level
    });
  }
  
  return { items: buildTocTree(items) };
}

function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

function buildTocTree(items: TocItem[]): TocItem[] {
  const tree: TocItem[] = [];
  const stack: TocItem[] = [];
  
  for (const item of items) {
    // Remove items from stack that are at the same level or deeper
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      // This is a top-level item
      tree.push(item);
    } else {
      // This is a child item
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    }
    
    stack.push(item);
  }
  
  return tree;
}

export function flattenTocTree(tree: TocItem[]): TocItem[] {
  const flattened: TocItem[] = [];
  
  function traverse(items: TocItem[]) {
    for (const item of items) {
      flattened.push(item);
      if (item.children) {
        traverse(item.children);
      }
    }
  }
  
  traverse(tree);
  return flattened;
}

export function getTocFromMdxContent(mdxContent: string): TocTree {
  // Remove frontmatter if present
  const contentWithoutFrontmatter = mdxContent.replace(/^---[\s\S]*?---\n/, '');
  
  // Remove code blocks first to prevent parsing headings inside code
  const contentWithoutCodeBlocks = contentWithoutFrontmatter
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, ''); // Remove inline code
  
  // Remove MDX components and JSX to get clean markdown
  const cleanContent = contentWithoutCodeBlocks
    .replace(/<[^>]*>/g, '') // Remove HTML/JSX tags
    .replace(/import\s+.*?from\s+['"].*?['"];?\n/g, '') // Remove imports
    .replace(/export\s+.*?;?\n/g, ''); // Remove exports
  
  return extractTocFromContent(cleanContent);
}