import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await database.getDocument(params.id);

    if (!document) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('获取文档错误:', error);
    return NextResponse.json(
      { error: '获取文档失败' },
      { status: 500 }
    );
  }
}