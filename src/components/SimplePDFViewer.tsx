'use client'

import { useState } from 'react'
import { Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react'

interface SimplePDFViewerProps {
  fileUrl: string
  fileName?: string
}

export default function SimplePDFViewer({ fileUrl, fileName }: SimplePDFViewerProps) {
  const [scale, setScale] = useState(100)
  const [viewMode, setViewMode] = useState<'iframe' | 'embed' | 'object'>('iframe')

  const downloadPDF = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName || 'document.pdf'
    link.click()
  }

  const openInNewTab = () => {
    window.open(fileUrl, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium">PDF 文档查看器</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setScale(Math.max(50, scale - 10))}
              className="p-2 rounded hover:bg-gray-100"
              title="缩小"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm min-w-[60px] text-center">{scale}%</span>
            <button
              onClick={() => setScale(Math.min(200, scale + 10))}
              className="p-2 rounded hover:bg-gray-100"
              title="放大"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
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

      <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '80vh' }}>
        {viewMode === 'iframe' && (
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="PDF Viewer"
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
            src={fileUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        )}

        {viewMode === 'object' && (
          <object
            data={fileUrl}
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
      </div>
    </div>
  )
}