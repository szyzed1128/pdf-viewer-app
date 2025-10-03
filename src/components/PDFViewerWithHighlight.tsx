'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react'
import { SearchResult } from '@/types'
import dynamic from 'next/dynamic'

// 动态导入PDF.js以避免SSR问题
let pdfjsLib: any = null
if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((module) => {
    pdfjsLib = module
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  })
}

interface PDFViewerWithHighlightProps {
  fileUrl: string
  fileName?: string
  searchResults?: SearchResult[]
  currentSearchIndex?: number
  onPageChange?: (page: number) => void
  totalPages?: number
}

export default function PDFViewerWithHighlight({
  fileUrl,
  fileName,
  searchResults = [],
  currentSearchIndex = -1,
  onPageChange,
  totalPages: propTotalPages
}: PDFViewerWithHighlightProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(propTotalPages || 0)
  const [scale, setScale] = useState(1.5)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const highlightLayerRef = useRef<HTMLDivElement>(null)

  // 加载PDF文档
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfjsLib) {
        // 等待PDF.js加载
        setTimeout(loadPDF, 100)
        return
      }

      try {
        const loadingTask = pdfjsLib.getDocument(fileUrl)
        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
      } catch (error) {
        console.error('加载PDF失败:', error)
      }
    }

    loadPDF()
  }, [fileUrl])

  // 渲染当前页
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage)
        const viewport = page.getViewport({ scale })

        const canvas = canvasRef.current!
        const context = canvas.getContext('2d')!

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        await page.render(renderContext).promise

        // 渲染文本层（用于高亮）
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = ''
          const textContent = await page.getTextContent()

          textLayerRef.current.style.width = `${viewport.width}px`
          textLayerRef.current.style.height = `${viewport.height}px`
        }

        // 渲染高亮
        renderHighlights(page, viewport)
      } catch (error) {
        console.error('渲染页面失败:', error)
      }
    }

    renderPage()
  }, [pdfDoc, currentPage, scale])

  // 渲染高亮
  const renderHighlights = async (page: any, viewport: any) => {
    if (!highlightLayerRef.current || !pdfjsLib) return

    highlightLayerRef.current.innerHTML = ''

    // 获取当前页的搜索结果
    const pageResults = searchResults.filter(r => r.pageNumber === currentPage)
    if (pageResults.length === 0) return

    try {
      const textContent = await page.getTextContent()

      pageResults.forEach((result, index) => {
        const searchText = result.text.toLowerCase()
        const isCurrent = searchResults.indexOf(result) === currentSearchIndex

        textContent.items.forEach((item: any) => {
          const itemText = item.str.toLowerCase()
          if (itemText.includes(searchText)) {
            // 计算文本位置
            const tx = item.transform[4]
            const ty = item.transform[5]
            const left = tx * viewport.scale
            const top = (viewport.height - ty) * viewport.scale

            const highlight = document.createElement('div')
            highlight.style.position = 'absolute'
            highlight.style.left = `${left}px`
            highlight.style.top = `${top - item.height * viewport.scale}px`
            highlight.style.width = `${item.width * viewport.scale}px`
            highlight.style.height = `${item.height * viewport.scale}px`
            highlight.style.backgroundColor = isCurrent ? 'rgba(255, 165, 0, 0.4)' : 'rgba(255, 255, 0, 0.3)'
            highlight.style.border = isCurrent ? '2px solid orange' : 'none'
            highlight.style.pointerEvents = 'none'
            highlight.style.mixBlendMode = 'multiply'

            highlightLayerRef.current!.appendChild(highlight)
          }
        })
      })
    } catch (error) {
      console.error('渲染高亮失败:', error)
    }
  }

  // 更新高亮当搜索索引改变时
  useEffect(() => {
    if (currentSearchIndex >= 0 && searchResults.length > 0) {
      const result = searchResults[currentSearchIndex]
      if (result && result.pageNumber !== currentPage) {
        goToPage(result.pageNumber)
      } else if (pdfDoc) {
        // 重新渲染高亮
        pdfDoc.getPage(currentPage).then((page: any) => {
          const viewport = page.getViewport({ scale })
          renderHighlights(page, viewport)
        })
      }
    }
  }, [currentSearchIndex, searchResults])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      onPageChange?.(page)
    }
  }

  const downloadPDF = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName || 'document.pdf'
    link.click()
  }

  const openInNewTab = () => {
    window.open(fileUrl, '_blank')
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const getCurrentPageResults = () => {
    return searchResults.filter(r => r.pageNumber === currentPage)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium">PDF 查看器（高亮模式）</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="p-1 rounded hover:bg-gray-100"
              title="缩小"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600">{Math.round(scale * 100)}%</span>
            <button
              onClick={zoomIn}
              className="p-1 rounded hover:bg-gray-100"
              title="放大"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
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

      <div className="relative border rounded-lg overflow-auto bg-gray-100" style={{ height: '80vh' }}>
        <div className="relative inline-block">
          <canvas ref={canvasRef} className="block" />

          {/* 文本层 */}
          <div
            ref={textLayerRef}
            className="absolute top-0 left-0"
            style={{ opacity: 0 }}
          />

          {/* 高亮层 */}
          <div
            ref={highlightLayerRef}
            className="absolute top-0 left-0"
          />
        </div>

        {/* 页面信息 */}
        {getCurrentPageResults().length > 0 && (
          <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 rounded p-2 text-sm">
            <div className="font-medium text-yellow-800">
              本页搜索结果: {getCurrentPageResults().length} 个
            </div>
          </div>
        )}

        {/* 当前搜索结果指示器 */}
        {currentSearchIndex >= 0 && searchResults.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-blue-100 border border-blue-300 rounded p-2 text-sm">
            <div className="font-medium text-blue-800">
              搜索结果 {currentSearchIndex + 1} / {searchResults.length}
            </div>
            <div className="text-blue-700 max-w-48 truncate">
              "{searchResults[currentSearchIndex]?.text}"
            </div>
          </div>
        )}
      </div>

      {/* 页面导航 */}
      <div className="flex items-center justify-center space-x-4 bg-white border rounded-lg p-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          上一页
        </button>
        <span className="text-sm">
          第 {currentPage} / {totalPages} 页
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          下一页
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        {searchResults.length > 0 && (
          <span className="text-yellow-600">
            • 当前文档共找到 {searchResults.length} 个搜索结果
            {getCurrentPageResults().length > 0 && ` (本页 ${getCurrentPageResults().length} 个)`}
          </span>
        )}
      </div>
    </div>
  )
}
