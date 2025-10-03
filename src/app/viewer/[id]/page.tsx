'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Info } from 'lucide-react'
import SearchablePDFViewer from '@/components/SearchablePDFViewer'
import { PDFDocument } from '@/types'

export default function PDFViewerPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<PDFDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDocumentInfo, setShowDocumentInfo] = useState(true)
  const [dynamicPageCount, setDynamicPageCount] = useState<number | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchDocument(params.id as string)
    }
  }, [params.id])

  // 动态获取PDF页数
  useEffect(() => {
    if (document?.filePath) {
      const filename = document.filePath.split('/').pop()
      if (filename) {
        fetch(`/api/pdf-info/${filename}`)
          .then(response => response.json())
          .then(data => {
            if (data.estimatedPages) {
              console.log(`文档信息面板动态获取的页数: ${data.estimatedPages}`)
              setDynamicPageCount(data.estimatedPages)
            }
          })
          .catch(error => {
            console.error('文档信息面板获取PDF页数失败:', error)
          })
      }
    }
  }, [document?.filePath])

  const fetchDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`)
      if (response.ok) {
        const data = await response.json()
        setDocument(data)
      } else {
        setError('文档不存在')
      }
    } catch (error) {
      console.error('获取文档失败:', error)
      setError('获取文档失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                返回文档库
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{document.originalName}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{(dynamicPageCount || document.pageCount) ? `${dynamicPageCount || document.pageCount} 页` : '多页文档'}</span>
                  <span>•</span>
                  <span>{(document.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                  <span>•</span>
                  <span>添加于 {new Date(document.uploadDate).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/search/${document.id}`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="h-4 w-4" />
                智能搜索
              </Link>
              <a
                href={document.filePath}
                download={document.originalName}
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                下载文档
              </a>
              {!showDocumentInfo && (
                <button
                  onClick={() => setShowDocumentInfo(true)}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  title="显示文档信息"
                >
                  <Info className="h-4 w-4" />
                  文档信息
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF查看器主体 */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <SearchablePDFViewer
            fileUrl={document.filePath}
            fileName={document.originalName}
            totalPages={dynamicPageCount || document.pageCount}
          />
        </div>
      </div>

      {/* 文档信息面板 */}
      {showDocumentInfo && (
        <div className="fixed bottom-6 right-6 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">文档信息</h3>
            <button
              onClick={() => setShowDocumentInfo(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="关闭文档信息"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>文件名:</span>
              <span className="font-medium truncate ml-2" title={document.originalName}>
                {document.originalName.length > 20
                  ? document.originalName.substring(0, 20) + '...'
                  : document.originalName}
              </span>
            </div>
            <div className="flex justify-between">
              <span>文件大小:</span>
              <span className="font-medium">{(document.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span>页数:</span>
              <span className="font-medium">{(dynamicPageCount || document.pageCount) || '未知'} 页</span>
            </div>
            <div className="flex justify-between">
              <span>添加时间:</span>
              <span className="font-medium">{new Date(document.uploadDate).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}