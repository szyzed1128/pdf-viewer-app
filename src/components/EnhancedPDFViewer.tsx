'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Home,
  Move,
  RefreshCw,
  HelpCircle
} from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

// 配置 CMap 和标准字体以支持中文显示，启用流式加载
const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  // 启用流式加载，优化大文件加载速度
  isEvalSupported: false,
  disableRange: false,  // 启用范围请求，支持分块加载
  disableStream: false  // 启用流式加载
}

interface EnhancedPDFViewerProps {
  fileUrl: string
  fileName?: string
  totalPages?: number
}

export default function EnhancedPDFViewer({ fileUrl, fileName, totalPages: propTotalPages }: EnhancedPDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(propTotalPages || 0)
  const [pageWidth, setPageWidth] = useState(1200)
  const [rotation, setRotation] = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]))
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({})
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState(false)

  const viewerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const pdfDocumentRef = useRef<any>(null)

  // PDF文档加载成功回调
  const onDocumentLoadSuccess = (pdf: any) => {
    const numPages = pdf.numPages
    console.log(`PDF文档加载成功，总页数: ${numPages}`)
    setTotalPages(numPages)
    setIsLoading(false)
    setLoadError(null)
    setLoadingProgress(100)
    pdfDocumentRef.current = pdf
    // 生成缩略图
    generateThumbnails(pdf, numPages)
  }

  // PDF加载错误回调
  const onDocumentLoadError = (error: Error) => {
    console.error('PDF加载错误:', error)
    setLoadError(error.message)
    setIsLoading(false)
    setLoadingProgress(0)
  }

  // PDF加载进度回调
  const onDocumentLoadProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.round((loaded / total) * 100)
      setLoadingProgress(progress)
    }
  }

  // 生成缩略图
  const generateThumbnails = async (pdf: any, numPages: number) => {
    const thumbnailCache: { [key: number]: string } = {}
    const scale = 0.3 // 缩略图缩放比例

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise

        thumbnailCache[pageNum] = canvas.toDataURL()
      } catch (error) {
        console.error(`生成第${pageNum}页缩略图失败:`, error)
      }
    }

    setThumbnails(thumbnailCache)
    setThumbnailsLoaded(true)
  }

  // 滚动到指定页面
  const scrollToPage = (pageNumber: number) => {
    const pageElement = pageRefs.current[pageNumber]
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      console.log(`滚动到第 ${pageNumber} 页`)
    } else {
      // 如果目标页面还未渲染，先更新当前页再滚动
      console.log(`页面 ${pageNumber} 尚未渲染，等待渲染后滚动`)
      setTimeout(() => {
        const element = pageRefs.current[pageNumber]
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  // Intersection Observer 用于懒加载页面
  useEffect(() => {
    if (!totalPages || totalPages === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute('data-page') || '0')
          if (entry.isIntersecting && pageNum > 0) {
            setVisiblePages((prev) => {
              const newSet = new Set(prev)
              newSet.add(pageNum)
              return newSet
            })
          }
        })
      },
      {
        root: null,
        rootMargin: '800px',
        threshold: 0
      }
    )

    // 延迟观察，确保DOM已渲染
    const timeoutId = setTimeout(() => {
      const elements = Object.values(pageRefs.current).filter(el => el !== null)
      elements.forEach((element) => {
        if (element) observer.observe(element)
      })
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [totalPages])

  // 监听滚动事件，更新当前页码
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    const handleScroll = () => {
      // 查找当前可见的页面
      const viewerRect = viewer.getBoundingClientRect()
      const viewerCenter = viewerRect.top + viewerRect.height / 2

      let closestPage = currentPage
      let minDistance = Infinity

      Object.entries(pageRefs.current).forEach(([pageNum, element]) => {
        if (element) {
          const rect = element.getBoundingClientRect()
          const pageCenter = rect.top + rect.height / 2
          const distance = Math.abs(pageCenter - viewerCenter)

          if (distance < minDistance) {
            minDistance = distance
            closestPage = parseInt(pageNum)
          }
        }
      })

      if (closestPage !== currentPage) {
        setCurrentPage(closestPage)
      }
    }

    viewer.addEventListener('scroll', handleScroll)
    return () => viewer.removeEventListener('scroll', handleScroll)
  }, [currentPage])


  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          console.log(`=== 键盘左箭头被按下 ===`)
          goToPrevPage()
          break
        case 'ArrowRight':
          e.preventDefault()
          console.log(`=== 键盘右箭头被按下 ===`)
          goToNextPage()
          break
        case '+':
        case '=':
          e.preventDefault()
          zoomIn()
          break
        case '-':
          e.preventDefault()
          zoomOut()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages])

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
    if (page >= 1 && page <= totalPages) {
      console.log(`跳转到第 ${page} 页 (总页数: ${totalPages})`)
      setCurrentPage(page)
      scrollToPage(page)
    } else {
      console.log(`页码 ${page} 超出范围 [1, ${totalPages}]`)
    }
  }


  const goToPrevPage = () => {
    console.log(`=== 上一页按钮被点击 ===`)
    console.log(`当前页=${currentPage}, 目标页=${currentPage - 1}, 总页数=${totalPages}`)
    goToPage(currentPage - 1)
  }

  const goToNextPage = () => {
    console.log(`=== 下一页按钮被点击 ===`)
    console.log(`当前页=${currentPage}, 目标页=${currentPage + 1}, 总页数=${totalPages}`)
    goToPage(currentPage + 1)
  }

  const zoomIn = () => {
    setPageWidth(prev => Math.min(2400, prev + 200))
  }

  const zoomOut = () => {
    setPageWidth(prev => Math.max(600, prev - 200))
  }

  const resetZoom = () => {
    setPageWidth(1200)
  }

  const rotate = () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    // React会自动重新渲染
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="p-2 rounded hover:bg-gray-100"
            title={showThumbnails ? "隐藏缩略图" : "显示缩略图"}
          >
            {showThumbnails ? '☰' : '☰'}
          </button>
          <h3 className="font-medium">PDF 查看器</h3>

          {/* 页面导航 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="上一页 (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="1"
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value) || 1
                  goToPage(page)
                }}
                className="w-16 px-2 py-1 text-sm border rounded text-center"
              />
              <span className="text-sm text-gray-500">/ {totalPages > 0 ? totalPages : '?'}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="下一页 (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 缩放控制 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="p-2 rounded hover:bg-gray-100"
              title="缩小 (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm min-w-[60px] text-center">{Math.round((pageWidth / 1200) * 100)}%</span>
            <button
              onClick={zoomIn}
              className="p-2 rounded hover:bg-gray-100"
              title="放大 (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 rounded hover:bg-gray-100"
              title="重置缩放 (0)"
            >
              <Home className="h-4 w-4" />
            </button>
          </div>

          {/* 旋转 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={rotate}
              className="p-2 rounded hover:bg-gray-100"
              title="旋转 (R)"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="p-2 rounded hover:bg-gray-100"
              title={showShortcuts ? "隐藏快捷键提示" : "显示快捷键提示"}
            >
              <HelpCircle className="h-4 w-4" />
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

      {/* PDF 查看区域 */}
      <div className="flex gap-4 h-[80vh]">
        {/* 缩略图面板 */}
        {showThumbnails && (
          <div className="w-48 border rounded-lg bg-white overflow-y-auto">
            <div className="p-2 space-y-2">
              {!thumbnailsLoaded ? (
                <div className="text-center text-sm text-gray-500 py-4">
                  正在生成缩略图...
                </div>
              ) : (
                Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <div
                    key={pageNum}
                    className={`cursor-pointer border rounded p-1 transition-all ${
                      pageNum === currentPage
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {thumbnails[pageNum] ? (
                      <img
                        src={thumbnails[pageNum]}
                        alt={`Page ${pageNum}`}
                        className="w-full"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                        加载中...
                      </div>
                    )}
                    <div className="text-center text-xs text-gray-600 mt-1">
                      {pageNum}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 主视图 */}
        <div
          ref={viewerRef}
          className="flex-1 border rounded-lg overflow-auto bg-gray-50"
        >
          <div className="flex flex-col items-center p-4 space-y-4">
          {isLoading && (
            <div className="text-center py-8 space-y-4">
              <div className="text-lg font-medium">加载PDF中...</div>
              {loadingProgress > 0 && (
                <div className="w-64 mx-auto">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">{loadingProgress}%</div>
                </div>
              )}
            </div>
          )}

          {loadError ? (
            <div className="text-center py-8 text-red-500">
              <div className="text-lg font-semibold mb-2">PDF加载失败</div>
              <div className="text-sm">{loadError}</div>
              <div className="mt-4">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  点击在新窗口打开PDF
                </a>
              </div>
            </div>
          ) : (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              onLoadProgress={onDocumentLoadProgress}
              loading={<div className="text-center py-8">加载PDF文档...</div>}
              error={<div className="text-center py-8 text-red-500">PDF文档加载失败</div>}
              options={pdfOptions}
            >
              {totalPages > 0 && Array.from(new Array(totalPages), (el, index) => {
                const pageNum = index + 1
                const isVisible = visiblePages.has(pageNum)
                // 前8页（目录页）启用文本层以正确显示中文，其他页使用Canvas模式提升性能
                const shouldRenderTextLayer = pageNum <= 8

                return (
                  <div
                    key={`page_${pageNum}`}
                    ref={(el) => (pageRefs.current[pageNum] = el)}
                    data-page={pageNum}
                    className="mb-4 shadow-lg bg-white"
                    style={{ minHeight: isVisible ? 'auto' : '1000px' }}
                  >
                    {isVisible ? (
                      <>
                        <Page
                          pageNumber={pageNum}
                          width={pageWidth}
                          rotate={rotation}
                          renderTextLayer={shouldRenderTextLayer}
                          renderAnnotationLayer={false}
                          loading={<div className="text-center py-4">加载页面 {pageNum}...</div>}
                        />
                        <div className="text-center text-sm text-gray-500 py-2 bg-gray-50">
                          第 {pageNum} 页 / 共 {totalPages} 页
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center text-gray-400" style={{ height: '1000px' }}>
                        第 {pageNum} 页（滚动加载中...）
                      </div>
                    )}
                  </div>
                )
              })}
            </Document>
          )}
        </div>

        {/* 控制提示 */}
        {showShortcuts && (
          <div className="fixed top-20 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg shadow-lg z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">快捷键:</span>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-300 hover:text-white transition-colors ml-3"
                title="关闭提示"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1">
              <div>← → 翻页</div>
              <div>+ - 缩放</div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 状态栏 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>文件: {fileName || 'document.pdf'}</span>
          <span>页面: {currentPage} / {totalPages || '?'}</span>
          <span>缩放: {Math.round((pageWidth / 1200) * 100)}%</span>
          <span>旋转: {rotation}°</span>
        </div>
        <div className="text-xs">
          提示: 使用翻页按钮或键盘快捷键翻页
        </div>
      </div>
    </div>
  )
}