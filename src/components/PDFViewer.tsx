'use client'

import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface PDFViewerProps {
  fileUrl: string
  onLoadSuccess?: (numPages: number) => void
  searchResults?: Array<{
    pageNumber: number
    position: { x: number; y: number; width: number; height: number }
  }>
  currentSearchIndex?: number
}

export default function PDFViewer({
  fileUrl,
  onLoadSuccess,
  searchResults = [],
  currentSearchIndex = -1
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    onLoadSuccess?.(numPages)
  }, [onLoadSuccess])

  const onDocumentLoadError = useCallback((error: any) => {
    console.error('PDF加载错误:', error)
    console.error('文件URL:', fileUrl)
    setLoading(false)
  }, [fileUrl])

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.1))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.1))
  }

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const downloadPDF = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = 'document.pdf'
    link.click()
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page)
    }
  }

  const currentPageResults = searchResults.filter(result => result.pageNumber === pageNumber)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">加载PDF中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-sm">
            {pageNumber} / {numPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mx-4 h-6 border-l"></div>

          <button
            onClick={zoomOut}
            className="p-2 rounded hover:bg-gray-100"
            title="缩小"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            className="p-2 rounded hover:bg-gray-100"
            title="放大"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            onClick={rotate}
            className="p-2 rounded hover:bg-gray-100"
            title="旋转"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {searchResults.length > 0 && (
            <div className="text-sm text-gray-600">
              找到 {searchResults.length} 个匹配项
            </div>
          )}

          <button
            onClick={downloadPDF}
            className="p-2 rounded hover:bg-gray-100"
            title="下载"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto max-h-[80vh] bg-gray-50">
        <div className="flex justify-center p-4">
          <div className="relative">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="text-center py-8">加载中...</div>}
              error={<div className="text-center py-8 text-red-500">PDF加载失败</div>}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                loading={<div className="text-center py-8">加载页面中...</div>}
                error={<div className="text-center py-8 text-red-500">页面加载失败</div>}
              />
            </Document>

            {currentPageResults.map((result, index) => (
              <div
                key={index}
                className={`absolute border-2 pointer-events-none ${
                  currentSearchIndex >= 0 &&
                  searchResults[currentSearchIndex]?.pageNumber === pageNumber &&
                  index === currentPageResults.findIndex(r => r === searchResults[currentSearchIndex])
                    ? 'border-red-500 bg-red-200 bg-opacity-30'
                    : 'border-yellow-400 bg-yellow-200 bg-opacity-30'
                }`}
                style={{
                  left: result.position.x * scale,
                  top: result.position.y * scale,
                  width: result.position.width * scale,
                  height: result.position.height * scale,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <input
          type="number"
          min="1"
          max={numPages}
          value={pageNumber}
          onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
          className="w-16 px-2 py-1 border rounded text-center"
        />
        <span className="text-sm text-gray-600">页</span>
      </div>
    </div>
  )
}