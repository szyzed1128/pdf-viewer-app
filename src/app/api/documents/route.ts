import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  try {
    const documents: any = await database.getDocuments();
    // 转换字段名从 snake_case 到 camelCase
    const formattedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      filename: doc.filename,
      originalName: doc.original_name,
      filePath: doc.file_path,
      uploadDate: doc.upload_date,
      fileSize: doc.file_size,
      pageCount: doc.page_count,
      extractedText: doc.extracted_text || ''
    }));
    return NextResponse.json(formattedDocuments);
  } catch (error) {
    console.error('获取文档列表错误:', error);
    return NextResponse.json(
      { error: '获取文档列表失败' },
      { status: 500 }
    );
  }
}