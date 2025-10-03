import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  try {
    const documents = await database.getDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error('获取文档列表错误:', error);
    return NextResponse.json(
      { error: '获取文档列表失败' },
      { status: 500 }
    );
  }
}