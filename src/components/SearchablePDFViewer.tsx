'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, ExternalLink } from 'lucide-react'
import { SearchResult } from '@/types'

interface SearchablePDFViewerProps {
  fileUrl: string
  fileName?: string
  searchResults?: SearchResult[]
  currentSearchIndex?: number
  onPageChange?: (page: number) => void
  totalPages?: number
  currentPageGroupedCount?: number
  targetPage?: number
  jumpTrigger?: number
}

export default function SearchablePDFViewer({
  fileUrl,
  fileName,
  searchResults = [],
  currentSearchIndex = -1,
  onPageChange,
  totalPages: propTotalPages,
  currentPageGroupedCount = 0,
  targetPage,
  jumpTrigger = 0
}: SearchablePDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(propTotalPages || 0)
  const [viewMode, setViewMode] = useState<'iframe' | 'embed' | 'object'>('iframe')
  const [searchHighlights, setSearchHighlights] = useState<{[key: number]: string[]}>({})
  const viewerRef = useRef<HTMLIFrameElement | HTMLEmbedElement | HTMLObjectElement>(null)
  const [markerPosition, setMarkerPosition] = useState({ x: 0, y: 16 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 更新totalPages当prop变化时
  useEffect(() => {
    if (propTotalPages && propTotalPages > 0) {
      setTotalPages(propTotalPages)
    }
  }, [propTotalPages])

  // 当父组件传入targetPage时，跳转到指定页面
  useEffect(() => {
    console.log(`SearchablePDFViewer: jumpTrigger=${jumpTrigger}, targetPage=${targetPage}, currentPage=${currentPage}`)
    if (jumpTrigger > 0 && targetPage && targetPage > 0) {
      console.log(`SearchablePDFViewer: 执行跳转到第 ${targetPage} 页`)
      // 无论页码是否相同，都要更新状态并强制刷新
      setCurrentPage(targetPage)
      setRefreshKey(prev => prev + 1)
      onPageChange?.(targetPage)
    }
  }, [jumpTrigger])

  // 动态获取PDF页数
  useEffect(() => {
    if (fileUrl && fileName) {
      // 从文件URL中提取文件名
      const filename = fileUrl.split('/').pop()
      if (filename) {
        fetch(`/api/pdf-info/${filename}`)
          .then(response => response.json())
          .then(data => {
            if (data.estimatedPages) {
              console.log(`SearchablePDFViewer动态获取的页数: ${data.estimatedPages}`)
              setTotalPages(data.estimatedPages)
            }
          })
          .catch(error => {
            console.error('SearchablePDFViewer获取PDF页数失败:', error)
          })
      }
    }
  }, [fileUrl, fileName])

  // 处理搜索结果高亮
  useEffect(() => {
    if (searchResults.length > 0) {
      const highlights: {[key: number]: string[]} = {}
      searchResults.forEach(result => {
        if (!highlights[result.pageNumber]) {
          highlights[result.pageNumber] = []
        }
        highlights[result.pageNumber].push(result.text)
      })
      setSearchHighlights(highlights)
    }
  }, [searchResults])

  const downloadPDF = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName || 'document.pdf'
    link.click()
  }

  const openInNewTab = () => {
    window.open(fileUrl, '_blank')
  }

  const goToPage = (page: number) => {
    if (page >= 1) {
      console.log(`goToPage: 设置页码为 ${page}`)
      console.log(`goToPage: 文件URL = ${fileUrl}`)
      setCurrentPage(page)
      onPageChange?.(page)
      // React会自动重新渲染PDF元素
      console.log(`goToPage: 即将生成的iframe URL = ${fileUrl}#page=${page}&toolbar=1&navpanes=1&scrollbar=1&view=FitH&zoom=page-fit`)
    } else {
      console.warn(`goToPage: 无效页码 ${page}`)
    }
  }

  const getCurrentPageHighlights = () => {
    return searchHighlights[currentPage] || []
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - markerPosition.x,
      y: e.clientY - markerPosition.y
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current.getBoundingClientRect()
    const markerWidth = 200 // 提示框宽度
    const markerHeight = 60 // 提示框高度

    let newX = e.clientX - dragStart.x
    let newY = e.clientY - dragStart.y

    // 限制在容器边界内
    newX = Math.max(0, Math.min(newX, container.width - markerWidth))
    newY = Math.max(0, Math.min(newY, container.height - markerHeight))

    setMarkerPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const renderSearchMarkers = () => {
    const highlights = getCurrentPageHighlights()
    if (highlights.length === 0) return null

    // 使用传入的分组计数，如果没有则使用原来的高亮数量
    const displayCount = currentPageGroupedCount > 0 ? currentPageGroupedCount : highlights.length

    return (
      <div
        className="absolute bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 text-sm shadow-lg cursor-move select-none"
        style={{
          left: `${markerPosition.x}px`,
          top: `${markerPosition.y}px`,
          width: '200px'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="font-bold text-yellow-900">
          🔍 本页搜索结果: {displayCount} 个
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium">PDF 文档查看器</h3>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="iframe">IFrame 模式</option>
            <option value="embed">Embed 模式</option>
            <option value="object">Object 模式</option>
          </select>

          <button
            onClick={openInNewTab}
            className="p-2 rounded hover:bg-gray-100"
            title="在新窗口打开"
          >
            <ExternalLink className="h-4 w-4" />
          </button>

          <button
            onClick={downloadPDF}
            className="p-2 rounded hover:bg-gray-100"
            title="下载"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative border rounded-lg overflow-hidden bg-gray-50" style={{ height: '80vh' }}>
        {viewMode === 'iframe' && (
          <iframe
            ref={viewerRef as React.RefObject<HTMLIFrameElement>}
            src={`${fileUrl}#page=${currentPage}`}
            key={`search-iframe-${fileUrl}-${currentPage}-${refreshKey}`}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="PDF Viewer"
            onLoad={() => {
              // 尝试从iframe获取总页数（如果可能）
              console.log(`iframe onLoad: currentPage=${currentPage}, refreshKey=${refreshKey}, src=${fileUrl}#page=${currentPage}`)
              try {
                // 注意：由于同源策略，这可能不总是有效
                setTotalPages(100) // 默认值，实际使用中可能需要其他方法获取
              } catch (e) {
                console.log('无法获取PDF页数')
              }
            }}
          >
            <p>
              您的浏览器不支持内嵌PDF查看。
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                点击这里在新窗口中打开PDF
              </a>
            </p>
          </iframe>
        )}

        {viewMode === 'embed' && (
          <embed
            ref={viewerRef as React.RefObject<HTMLEmbedElement>}
            src={`${fileUrl}#page=${currentPage}`}
            key={`search-embed-${fileUrl}-${currentPage}-${refreshKey}`}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        )}

        {viewMode === 'object' && (
          <object
            ref={viewerRef as React.RefObject<HTMLObjectElement>}
            data={`${fileUrl}#page=${currentPage}`}
            key={`search-object-${fileUrl}-${currentPage}-${refreshKey}`}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          >
            <p>
              您的浏览器不支持内嵌PDF查看。
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                点击这里在新窗口中打开PDF
              </a>
            </p>
          </object>
        )}

        {/* 搜索结果标记 */}
        {renderSearchMarkers()}
      </div>

      <div className="text-center text-sm text-gray-500">
        如果PDF无法显示，请
        <button
          onClick={openInNewTab}
          className="text-blue-500 hover:underline mx-1"
        >
          点击这里在新窗口中打开
        </button>
        或
        <button
          onClick={downloadPDF}
          className="text-blue-500 hover:underline mx-1"
        >
          下载文件
        </button>
        {searchResults.length > 0 && (
          <span className="ml-2 text-yellow-600">
            • 当前文档共找到 {searchResults.length} 个搜索结果
          </span>
        )}
      </div>
    </div>
  )
}