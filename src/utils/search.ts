import { SearchResult } from '@/types';

export interface TextMatch {
  text: string;
  context: string;
  position: number;
  pageNumber: number;
  type: 'title' | 'description' | 'table' | 'text';
}

export class PDFSearchEngine {
  private synonyms: Map<string, string[]> = new Map();

  constructor(synonymsData: Array<{ term: string; synonyms: string[] }> = []) {
    this.loadSynonyms(synonymsData);
  }

  private loadSynonyms(synonymsData: Array<{ term: string; synonyms: string[] }>) {
    synonymsData.forEach(({ term, synonyms }) => {
      const allTerms = [term, ...synonyms];
      allTerms.forEach(t => {
        this.synonyms.set(t.toLowerCase(), allTerms);
      });
    });
  }

  private expandQuery(query: string, includeSynonyms: boolean = false): string[] {
    const terms = query.toLowerCase().split(/\s+/);
    if (!includeSynonyms) return terms;

    const expandedTerms = new Set<string>();

    terms.forEach(term => {
      expandedTerms.add(term);
      const synonymList = this.synonyms.get(term);
      if (synonymList) {
        synonymList.forEach(synonym => expandedTerms.add(synonym.toLowerCase()));
      }
    });

    return Array.from(expandedTerms);
  }

  private detectTextType(text: string, context: string, fullPageText: string = ''): 'title' | 'description' | 'table' | 'text' {
    // 检查表格特征
    if (text.includes('|') || text.includes('\t') || /\d+\s*\|\s*\d+/.test(text)) {
      return 'table';
    }

    // 检查是否在描述上下文中
    if (context.includes('说明') || context.includes('描述') || context.includes('Description')) {
      return 'description';
    }

    // 默认为描述类型（因为现在已经在描述部分搜索了）
    return 'description';
  }

  private calculateRelevanceScore(
    match: string,
    query: string,
    type: 'title' | 'description' | 'table' | 'text',
    context: string
  ): number {
    let score = 0;

    const typeWeights = {
      title: 1000,      // 元件标题 - 最高优先级
      description: 100, // 元件描述 - 中等优先级
      table: 10,        // 表格
      text: 1           // 普通文本 - 最低优先级
    };

    score += typeWeights[type];

    const queryLower = query.toLowerCase();
    const matchLower = match.toLowerCase();

    // 精确匹配加分
    if (matchLower === queryLower) {
      score += 50;
    } else if (matchLower.includes(queryLower)) {
      score += 30;
    } else {
      const queryWords = queryLower.split(/\s+/);
      const matchWords = queryWords.filter(word => matchLower.includes(word));
      score += matchWords.length * 10;
    }

    // 上下文匹配加分
    if (context.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    return score;
  }

  public searchInPageText(
    pageText: string,
    pageNumber: number,
    query: string,
    includeSynonyms: boolean = false
  ): SearchResult[] {
    const searchTerms = this.expandQuery(query, includeSynonyms);
    const results: SearchResult[] = [];

    // 提取三种类型的文本部分
    const titleMatch = pageText.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
    const descMatch = pageText.match(/\[DESCRIPTION\](.*?)\[\/DESCRIPTION\]/s);
    const textMatch = pageText.match(/\[TEXT\](.*?)\[\/TEXT\]/s);

    const titleText = titleMatch ? titleMatch[1] : '';
    const descText = descMatch ? descMatch[1] : '';
    const circuitText = textMatch ? textMatch[1] : '';

    // 在标题中搜索（表格文本 - 最高优先级）
    if (titleText) {
      searchTerms.forEach(term => {
        const regex = new RegExp(term, 'gi');
        let match;
        while ((match = regex.exec(titleText)) !== null) {
          const relevanceScore = this.calculateRelevanceScore(match[0], query, 'title', titleText);
          results.push({
            pageNumber: pageNumber,
            text: match[0],
            context: this.highlightMatches(titleText.substring(0, 100), [term]),
            relevanceScore,
            position: {
              x: 50,
              y: 50,
              width: match[0].length * 8,
              height: 16
            },
            type: 'title'
          });
        }
      });
    }

    // 在描述中搜索（独立说明文本 - 中等优先级）
    if (descText) {
      const lines = descText.split('\n');
      lines.forEach((line, lineIndex) => {
        const lineText = line.trim();
        if (!lineText) return;

        searchTerms.forEach(term => {
          const regex = new RegExp(term, 'gi');
          let match;

          while ((match = regex.exec(lineText)) !== null) {
            const contextStart = Math.max(0, lineIndex - 2);
            const contextEnd = Math.min(lines.length, lineIndex + 3);
            const context = lines.slice(contextStart, contextEnd).join(' ').trim();

            const textType = this.detectTextType(match[0], context, descText);
            const relevanceScore = this.calculateRelevanceScore(match[0], query, textType, context);

            results.push({
              pageNumber: pageNumber,
              text: match[0],
              context: this.highlightMatches(context, [term]),
              relevanceScore,
              position: {
                x: 50,
                y: 100 + lineIndex * 20,
                width: match[0].length * 8,
                height: 16
              },
              type: textType
            });
          }
        });
      });
    }

    // 在电路图文本中搜索（普通文本 - 最低优先级）
    if (circuitText) {
      const lines = circuitText.split('\n');
      lines.forEach((line, lineIndex) => {
        const lineText = line.trim();
        if (!lineText) return;

        searchTerms.forEach(term => {
          const regex = new RegExp(term, 'gi');
          let match;

          while ((match = regex.exec(lineText)) !== null) {
            const contextStart = Math.max(0, lineIndex - 2);
            const contextEnd = Math.min(lines.length, lineIndex + 3);
            const context = lines.slice(contextStart, contextEnd).join(' ').trim();

            // 电路图文本固定为'text'类型
            const relevanceScore = this.calculateRelevanceScore(match[0], query, 'text', context);

            results.push({
              pageNumber: pageNumber,
              text: match[0],
              context: this.highlightMatches(context, [term]),
              relevanceScore,
              position: {
                x: 50,
                y: 200 + lineIndex * 20,
                width: match[0].length * 8,
                height: 16
              },
              type: 'text'
            });
          }
        });
      });
    }

    return results;
  }

  public searchInText(
    extractedText: string,
    query: string,
    includeSynonyms: boolean = false
  ): SearchResult[] {
    const searchTerms = this.expandQuery(query, includeSynonyms);
    const results: SearchResult[] = [];
    const pages = this.splitIntoPages(extractedText);

    pages.forEach((pageText, pageIndex) => {
      const lines = pageText.split('\n');

      lines.forEach((line, lineIndex) => {
        const lineText = line.trim();
        if (!lineText) return;

        searchTerms.forEach(term => {
          const regex = new RegExp(term, 'gi');
          let match;

          while ((match = regex.exec(lineText)) !== null) {
            const contextStart = Math.max(0, lineIndex - 2);
            const contextEnd = Math.min(lines.length, lineIndex + 3);
            const context = lines.slice(contextStart, contextEnd).join(' ').trim();

            const textType = this.detectTextType(lineText, context);
            const relevanceScore = this.calculateRelevanceScore(match[0], query, textType, context);

            results.push({
              pageNumber: pageIndex + 1,
              text: match[0],
              context: this.highlightMatches(context, [term]),
              relevanceScore,
              position: {
                x: 50,
                y: 100 + lineIndex * 20,
                width: match[0].length * 8,
                height: 16
              },
              type: textType
            });
          }
        });
      });
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private splitIntoPages(text: string): string[] {
    // 尝试多种页面分割方式
    let pages: string[] = [];

    // 方法1: 使用换页符分割
    if (text.includes('\f')) {
      pages = text.split('\f');
    }
    // 方法2: 使用页码标记分割
    else if (/第\s*\d+\s*页|Page\s*\d+/i.test(text)) {
      pages = text.split(/(?=第\s*\d+\s*页)|(?=Page\s*\d+)/i);
    }
    // 方法3: 按字符数估算分页（每页约2000字符）
    else {
      const pageSize = 2000;
      for (let i = 0; i < text.length; i += pageSize) {
        pages.push(text.substring(i, i + pageSize));
      }
    }

    return pages.filter(page => page.trim().length > 0);
  }

  private highlightMatches(text: string, terms: string[]): string {
    let highlighted = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    return highlighted;
  }
}