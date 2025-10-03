import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document: any = await database.getDocument(params.id);

    if (!document) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    // 转换字段名从 snake_case 到 camelCase
    const formattedDocument = {
      id: document.id,
      filename: document.filename,
      originalName: document.original_name,
      filePath: document.file_path,
      uploadDate: document.upload_date,
      fileSize: document.file_size,
      pageCount: document.page_count,
      extractedText: document.extracted_text || ''
    };

    return NextResponse.json(formattedDocument);
  } catch (error) {
    console.error('获取文档错误:', error);
    return NextResponse.json(
      { error: '获取文档失败' },
      { status: 500 }
    );
  }
}