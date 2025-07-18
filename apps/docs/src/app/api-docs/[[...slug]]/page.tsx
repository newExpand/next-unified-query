import { notFound } from 'next/navigation';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApiDocsPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function ApiDocsPage({ params }: ApiDocsPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug || ['globals'];
  const filePath = slug.join('/');
  
  try {
    const fullPath = join(process.cwd(), 'public', 'api-docs', `${filePath}.md`);
    const content = await readFile(fullPath, 'utf8');
    
    // Clean and process content with comprehensive markdown parsing
    let processedContent = content
      // Fix version numbers throughout content
      .replace(/v1\.0\.0/g, 'v0.1.x')
      // Clean up redundant content and duplicates
      .replace(/^\*\*Next Unified Query v[0-9.x]+\*\*\n/gm, '')
      .replace(/^\*\*\*\n/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      // More sophisticated duplicate H1 removal - split by lines and process
      .split('\n')
      .reduce((acc, line, index, arr) => {
        if (line.startsWith('# ')) {
          // If this is an H1 and we already have one, skip it
          const hasH1Already = acc.some(prevLine => prevLine.startsWith('# '));
          if (hasH1Already) {
            return acc; // Skip this H1
          }
        }
        acc.push(line);
        return acc;
      }, [] as string[])
      .join('\n');

    // Split content into lines for better processing
    const lines = processedContent.split('\n');
    const htmlLines: string[] = [];
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeBlockLanguage = 'text';
    let firstH1Found = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          codeBlockLines = [];
          codeBlockLanguage = trimmedLine.substring(3) || 'text';
          continue;
        } else {
          // End of code block
          inCodeBlock = false;
          const codeContent = codeBlockLines.join('\n');
          htmlLines.push(`<div class="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 shadow-lg">
            <pre class="text-sm font-mono text-slate-100 overflow-x-auto"><code class="language-${codeBlockLanguage}">${codeContent}</code></pre>
          </div>`);
          codeBlockLines = [];
          continue;
        }
      }
      
      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }
      
      // Skip empty lines
      if (!trimmedLine) {
        htmlLines.push('<br>');
        continue;
      }
      
      // Process headings with duplicate detection
      if (trimmedLine.startsWith('#')) {
        const level = (trimmedLine.match(/^#+/) || [''])[0].length;
        const text = trimmedLine.replace(/^#+\s*/, '');
        
        // Skip the first H1 to avoid duplication with the page title
        if (level === 1 && !firstH1Found) {
          firstH1Found = true;
          continue;
        }
        
        switch (level) {
          case 1:
            htmlLines.push(`<h1 class="text-3xl font-bold text-foreground mb-6 pb-3 border-b border-border">${text}</h1>`);
            break;
          case 2:
            htmlLines.push(`<h2 class="text-2xl font-semibold text-primary mt-8 mb-4">${text}</h2>`);
            break;
          case 3:
            htmlLines.push(`<h3 class="text-xl font-medium text-foreground mt-6 mb-3 bg-muted/20 px-3 py-2 rounded border-l-4 border-primary">${text}</h3>`);
            break;
          case 4:
            htmlLines.push(`<h4 class="text-lg font-medium text-muted-foreground mt-4 mb-2">${text}</h4>`);
            break;
          case 5:
            htmlLines.push(`<h5 class="text-base font-medium text-primary mt-3 mb-2 pl-4 border-l-2 border-primary/30">${text}</h5>`);
            break;
          default:
            htmlLines.push(`<h6 class="text-sm font-medium text-muted-foreground mt-2 mb-1 pl-6">${text}</h6>`);
        }
        continue;
      }
      
      // Process bullet points
      if (trimmedLine.startsWith('- ')) {
        let content = trimmedLine.substring(2);
        
        // Process links in bullet point content
        content = content.replace(/"?\[(.+?)\]\(([^)]+?)\.md\)"?/g, 
          '<a href="/api-docs/$2" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">$1</a>');
        content = content.replace(/\[(.+?)\]\(\.\.\/(.+?)\.md\)/g, 
          '<a href="/api-docs/$2" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">$1</a>');
        content = content.replace(/\[(.+?)\]\((https?:\/\/[^)]+?)\)/g, 
          '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>');
        content = content.replace(/`([^`\n]+)`/g, 
          '<code class="bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-mono text-sm border">$1</code>');
        
        htmlLines.push(`<div class="flex items-start gap-3 mb-2 p-3 rounded border bg-card/50 hover:bg-card transition-colors">
          <span class="text-primary text-sm mt-0.5">•</span>
          <div class="text-muted-foreground">${content}</div>
        </div>`);
        continue;
      }
      
      // Process TypeDoc signature lines (starting with >)
      if (trimmedLine.startsWith('> ')) {
        const content = trimmedLine.substring(2);
        // Enhanced method signature styling with better contrast
        const enhancedContent = content
          .replace(/\*\*(.+?)\*\*/g, '<span class="text-blue-600 dark:text-blue-400 font-semibold">$1</span>')
          .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border">$1</code>');
        
        htmlLines.push(`<div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600 border-l-4 border-l-blue-500 pl-4 py-3 mb-4 font-mono text-sm rounded-r shadow-sm">
          ${enhancedContent}
        </div>`);
        continue;
      }
      
      // Process "Defined in:" lines with markdown links
      if (trimmedLine.startsWith('Defined in:')) {
        const match = trimmedLine.match(/Defined in:\s*\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const fileInfo = match[1];
          const githubUrl = match[2];
          
          htmlLines.push(`<div class="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <span>📍</span>
            <a href="${githubUrl}" 
               target="_blank" 
               class="text-primary hover:underline font-mono">
              ${fileInfo}
            </a>
          </div>`);
        }
        continue;
      }
      
      // Process regular paragraphs
      let processedLine = trimmedLine;
      
      // Fix complex Record type links (더 포괄적인 패턴)
      processedLine = processedLine.replace(
        /\[`?Record`?\]\(https:\/\/www\.typescriptlang\.org[^)]+\)\\?<([^>]+)>/g,
        '<code class="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono text-sm border">Record&lt;$1&gt;</code>'
      );
      
      // Fix broken Record links that show as plain text
      processedLine = processedLine.replace(
        /Record\]\(https:\/\/www\.typescriptlang\.org[^)]+\)\\?<([^>]+)>/g,
        '<code class="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono text-sm border">Record&lt;$1&gt;</code>'
      );
      
      // Fix internal links - handle all patterns including quoted ones
      // First handle quoted links: "[QueryClient](classes/QueryClient.md)"
      processedLine = processedLine.replace(/"?\[(.+?)\]\(([^)]+?)\.md\)"?/g, 
        '<a href="/api-docs/$2" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">$1</a>');
      
      // Handle relative links: ../path/file.md
      processedLine = processedLine.replace(/\[(.+?)\]\(\.\.\/(.+?)\.md\)/g, 
        '<a href="/api-docs/$2" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">$1</a>');
      
      // Fix external links (GitHub, MDN, etc.) - avoid processing already converted HTML
      // Only process if not already inside HTML tags
      if (!processedLine.includes('<a href=')) {
        processedLine = processedLine.replace(/\[([^\]]+?)\]\((https?:\/\/[^)]+?)\)/g, 
          '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>');
      }
      
      // Process inline code with better styling
      processedLine = processedLine.replace(/`([^`\n]+)`/g, 
        '<code class="bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-mono text-sm border">$1</code>');
      
      // Process bold text
      processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, 
        '<strong class="font-semibold text-foreground">$1</strong>');
      
      htmlLines.push(`<p class="text-muted-foreground leading-relaxed mb-3">${processedLine}</p>`);
    }
    
    const htmlContent = htmlLines.join('\n');
    
    // Extract title and fix version number
    const titleMatch = content.match(/^# (.+)$/m);
    let title = titleMatch ? titleMatch[1] : 'API Documentation';
    
    // Fix version number from v1.0.0 to v0.1.x
    title = title.replace(/v1\.0\.0/g, 'v0.1.x');
    
    // Special handling for globals page - hierarchical title structure
    const isGlobalsPage = filePath === 'globals';
    
    return (
      <div className="flex-1 py-6 lg:py-8">
        <div className="mb-6">
          {isGlobalsPage ? (
            // Breadcrumb structure for globals page
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <span>📚</span>
                <span className="hover:text-foreground cursor-pointer">Next Unified Query v0.1.x</span>
                <span>›</span>
                <span className="text-foreground font-medium">Core API</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold text-foreground">Core API</h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  API
                </Badge>
              </div>
            </div>
          ) : (
            // Standard title for other pages
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                API
              </Badge>
            </div>
          )}
        </div>
        
        <div className="prose prose-invert max-w-none">
          <div 
            className="api-docs-content text-muted-foreground leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading API docs:', error);
    notFound();
  }
}

export async function generateStaticParams() {
  // Generate static params for common API docs paths
  return [
    { slug: ['globals'] },
    { slug: ['README'] },
    { slug: ['classes'] },
    { slug: ['interfaces'] },
    { slug: ['functions'] },
    { slug: ['type-aliases'] },
    { slug: ['variables'] },
    { slug: ['enumerations'] },
  ];
}