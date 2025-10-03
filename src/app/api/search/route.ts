import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { PDFSearchEngine } from '@/utils/search';

export async function POST(request: NextRequest) {
  try {
    const { query, documentId, includeSynonyms = false } = await request.json();

    if (!query || !documentId) {
      return NextResponse.json(
        { error: '缺少查询参数' },
        { status: 400 }
      );
    }

    const document = await database.getDocument(documentId);
    if (!document) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    // 获取文档的所有页
    const documentPages = await database.getDocumentPages(documentId);
    if (!documentPages || documentPages.length === 0) {
      return NextResponse.json({
        results: [],
        query,
        documentId,
        totalMatches: 0,
      });
    }

    // 搜索所有页面
    const synonymsData = await database.getAllSynonyms();
    const searchEngine = new PDFSearchEngine(synonymsData);

    const allResults: any[] = [];
    for (const page of documentPages) {
      const pageResults = searchEngine.searchInPageText(
        page.page_text,
        page.page_number,
        query,
        includeSynonyms
      );
      allResults.push(...pageResults);
    }

    // 按相关度排序
    const results = allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      results,
      query,
      documentId,
      totalMatches: results.length,
    });
  } catch (error) {
    console.error('搜索错误:', error);
    return NextResponse.json(
      { error: '搜索失败' },
      { status: 500 }
    );
  }
}
