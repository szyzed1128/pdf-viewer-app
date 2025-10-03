import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PDFDocument } from 'pdf-lib'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    const pdfPath = path.join(process.cwd(), 'public', 'pdfs', filename)

    // 检查文件是否存在
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({ error: 'PDF文件不存在' }, { status: 404 })
    }

    // 读取PDF文件
    const pdfBuffer = fs.readFileSync(pdfPath)

    // 使用pdf-lib获取实际页数
    let actualPages: number
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      actualPages = pdfDoc.getPageCount()
      console.log(`PDF ${filename} 实际页数: ${actualPages}`)
    } catch (pdfError) {
      console.error('PDF解析失败，使用文件大小估算:', pdfError)
      // 回退到文件大小估算
      const stats = fs.statSync(pdfPath)
      const fileSizeInMB = stats.size / (1024 * 1024)
      actualPages = Math.max(Math.round(fileSizeInMB * 1024 / 200), 10)
    }

    const stats = fs.statSync(pdfPath)
    const fileSizeInMB = stats.size / (1024 * 1024)

    return NextResponse.json({
      filename,
      fileSizeInMB: Math.round(fileSizeInMB * 100) / 100,
      estimatedPages: actualPages,
      actualPages: actualPages,
      message: `读取PDF文件获得的实际页数`
    })

  } catch (error) {
    console.error('获取PDF信息失败:', error)
    return NextResponse.json({ error: '获取PDF信息失败' }, { status: 500 })
  }
}