'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Search, Calendar, HardDrive, BookOpen, Zap, Eye, Download, ExternalLink } from 'lucide-react'
import { PDFDocument } from '@/types'

export default function HomePage() {
  const [documents, setDocuments] = useState<PDFDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('获取文档列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <BookOpen className="h-8 w-8 text-primary" />
          <h2 className="text-4xl font-bold tracking-tight">汽车电路图文档库</h2>
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          包含汽车使用手册、整车电路图、线束图等专业技术文档，支持智能关键词搜索和同义词匹配
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>4个专业文档</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>智能搜索</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>同义词匹配</span>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">正在加载文档...</h3>
          <p className="text-muted-foreground">文档库正在初始化，请稍候</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <div key={doc.id} className="group border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-white">
              {/* 文件类型和大小 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">PDF 文档</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.page_count ? `${doc.page_count} 页` : '多页文档'}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{formatFileSize(doc.file_size)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(doc.upload_date)}
                  </div>
                </div>
              </div>

              {/* 文档标题 */}
              <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {doc.original_name}
              </h3>

              {/* 文档描述标签 */}
              <div className="flex flex-wrap gap-1 mb-4">
                {doc.original_name.includes('电路图') && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">电路图</span>
                )}
                {doc.original_name.includes('使用手册') && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">使用手册</span>
                )}
                {doc.original_name.includes('线束') && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">线束图</span>
                )}
                {doc.original_name.includes('汽车') && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">汽车</span>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Link
                    href={`/viewer/${doc.id}`}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium text-center hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    在线查看
                  </Link>
                  <Link
                    href={`/search/${doc.id}`}
                    className="flex items-center justify-center gap-2 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                  >
                    <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    智能搜索
                  </Link>
                </div>

                <div className="flex gap-2">
                  <a
                    href={doc.file_path}
                    download={doc.original_name}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    下载文档
                  </a>
                  <a
                    href={doc.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200 group"
                  >
                    <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}