'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, ChevronDown, ChevronUp, MapPin, FileText } from 'lucide-react'
import SearchablePDFViewer from '@/components/SearchablePDFViewer'
import { PDFDocument, SearchResult } from '@/types'

export default function SearchPage() {
  const params = useParams()
  const [document, setDocument] = useState<PDFDocument | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const [includeSynonyms, setIncludeSynonyms] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [jumpTrigger, setJumpTrigger] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchDocument(params.id as string)
    }
  }, [params.id])

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

  const handleSearch = async () => {
    if (!searchQuery.trim() || !document) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          documentId: document.id,
          includeSynonyms,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results)
        setCurrentSearchIndex(data.results.length > 0 ? 0 : -1)
        // 如果有搜索结果，立即跳转到第一个结果的页面
        if (data.results.length > 0) {
          const firstResultPage = data.results[0].pageNumber
          console.log(`handleSearch: 搜索完成，跳转到第一个结果的页码 ${firstResultPage}`)
          setCurrentPage(firstResultPage)
          setJumpTrigger(prev => prev + 1) // 强制触发跳转
        }
      } else {
        console.error('搜索失败')
      }
    } catch (error) {
      console.error('搜索错误:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // 获取分组后的搜索结果（按页码和类型分组，每页每种类型只显示一个）
  const getGroupedResults = () => {
    const grouped = new Map<string, { result: SearchResult; count: number }>()

    searchResults.forEach(result => {
      const key = `${result.pageNumber}-${result.type}`
      if (grouped.has(key)) {
        // 如果已存在，增加计数
        grouped.get(key)!.count++
      } else {
        // 如果不存在，添加新项
        grouped.set(key, { result, count: 1 })
      }
    })

    return Array.from(grouped.values()).map(item => item)
  }

  // 获取当前页面的分组结果数量
  const getCurrentPageGroupedCount = () => {
    if (!searchResults.length || currentSearchIndex < 0) return 0

    const currentResult = searchResults[currentSearchIndex]
    if (!currentResult) return 0

    // 找到当前结果所在页的分组信息
    const grouped = getGroupedResults()
    const currentGroup = grouped.find(
      item => item.result.pageNumber === currentResult.pageNumber &&
              item.result.type === currentResult.type
    )

    return currentGroup ? currentGroup.count : 0
  }

  // 根据分组结果的索引找到实际结果的索引
  const getActualResultIndex = (groupedIndex: number) => {
    const grouped = getGroupedResults()
    if (groupedIndex >= grouped.length) return -1

    const targetGroup = grouped[groupedIndex]
    return searchResults.findIndex(
      r => r.pageNumber === targetGroup.result.pageNumber && r.type === targetGroup.result.type
    )
  }

  const goToNextResult = () => {
    if (currentSearchIndex < 0 || currentSearchIndex >= searchResults.length - 1) return

    const currentResult = searchResults[currentSearchIndex]
    if (!currentResult) return

    const currentPageNum = currentResult.pageNumber
    const currentType = currentResult.type
    let nextIndex = currentSearchIndex + 1

    // 跳过同一页且同类型的其他结果
    while (nextIndex < searchResults.length) {
      const nextResult = searchResults[nextIndex]
      // 如果页码不同，或者页码相同但类型不同，就跳转
      if (nextResult.pageNumber !== currentPageNum || nextResult.type !== currentType) {
        break
      }
      nextIndex++
    }

    if (nextIndex < searchResults.length) {
      console.log(`goToNextResult: 从索引${currentSearchIndex}跳转到${nextIndex}`)
      setCurrentSearchIndex(nextIndex)
      const targetPageNum = searchResults[nextIndex].pageNumber
      setCurrentPage(targetPageNum)
      setJumpTrigger(prev => prev + 1) // 强制触发跳转
    }
  }

  const goToPrevResult = () => {
    if (currentSearchIndex <= 0 || currentSearchIndex >= searchResults.length) return

    const currentResult = searchResults[currentSearchIndex]
    if (!currentResult) return

    const currentPageNum = currentResult.pageNumber
    const currentType = currentResult.type
    let prevIndex = currentSearchIndex - 1

    // 跳过同一页且同类型的其他结果
    while (prevIndex >= 0) {
      const prevResult = searchResults[prevIndex]
      // 如果页码不同，或者页码相同但类型不同，就跳转
      if (prevResult.pageNumber !== currentPageNum || prevResult.type !== currentType) {
        break
      }
      prevIndex--
    }

    if (prevIndex >= 0) {
      console.log(`goToPrevResult: 从索引${currentSearchIndex}跳转到${prevIndex}`)
      setCurrentSearchIndex(prevIndex)
      const targetPageNum = searchResults[prevIndex].pageNumber
      setCurrentPage(targetPageNum)
      setJumpTrigger(prev => prev + 1) // 强制触发跳转
    }
  }

  const goToResult = (index: number) => {
    console.log(`page.tsx: goToResult called with index=${index}`)
    setCurrentSearchIndex(index)
    // 自动跳转到对应页面
    if (searchResults[index]) {
      const targetPageNum = searchResults[index].pageNumber
      console.log(`page.tsx: 设置currentPage为 ${targetPageNum}`)
      setCurrentPage(targetPageNum)
      setJumpTrigger(prev => prev + 1) // 强制触发跳转
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'title':
        return '📌'
      case 'description':
        return '📝'
      case 'table':
        return '📊'
      default:
        return '📄'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'title':
        return '标题'
      case 'description':
        return '描述'
      case 'table':
        return '表格'
      default:
        return '文本'
    }
  }

  const getRelevanceLevel = (score: number) => {
    if (score >= 1000) {
      return '高'
    } else if (score >= 100) {
      return '中'
    } else {
      return '低'
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        <div>
          <h1 className="text-2xl font-bold">搜索文档</h1>
          <p className="text-muted-foreground">{document.original_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">搜索设置</h3>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="请输入关键词，如：空调、继电器..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeSynonyms}
                  onChange={(e) => setIncludeSynonyms(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">包含同义词搜索</span>
              </label>
            </div>

            {isSearching && (
              <div className="text-center py-4 text-muted-foreground">
                搜索中...
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      找到 {searchResults.length} 个结果
                    </span>
                    {currentSearchIndex >= 0 && (
                      <span className="text-sm text-muted-foreground">
                        当前: {currentSearchIndex + 1} / {searchResults.length}
                      </span>
                    )}
                  </div>

                  {/* 导航按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={goToPrevResult}
                      disabled={currentSearchIndex <= 0}
                      className="flex-1 px-4 py-2 bg-white border-2 border-primary text-primary rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 font-medium"
                    >
                      ← 上一处
                    </button>
                    <button
                      onClick={goToNextResult}
                      disabled={currentSearchIndex >= searchResults.length - 1}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      下一处 →
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getGroupedResults().map((item, groupIndex) => {
                    const actualIndex = getActualResultIndex(groupIndex)
                    // 判断当前结果是否与这个分组匹配（基于页码和类型）
                    const currentResult = searchResults[currentSearchIndex]
                    const isCurrent = currentResult &&
                                     currentResult.pageNumber === item.result.pageNumber &&
                                     currentResult.type === item.result.type

                    return (
                      <div
                        key={`${item.result.pageNumber}-${item.result.type}`}
                        onClick={() => goToResult(actualIndex)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isCurrent
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              第 {item.result.pageNumber} 页 • {getTypeLabel(item.result.type)}
                            </span>
                            {item.count > 1 && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                {item.count} 个结果
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                当前
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            相关度: {getRelevanceLevel(item.result.relevanceScore)}
                          </span>
                        </div>
                        <div className="text-xs text-primary opacity-70">
                          点击跳转到此位置 →
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-4 text-muted-foreground">
                未找到相关结果
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium mb-2">搜索功能说明</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>同义词匹配：</strong>开启后可搜索相关术语</p>
              <div className="ml-4 text-xs space-y-0.5 mt-1 mb-2">
                <p>- 空调 = A/C = AC = Air Conditioning = HVAC...</p>
                <p>- 继电器 = Relay = 中继器...</p>
                <p>- 大灯 = 前照灯 = Headlight...</p>
                <p>- ABS = 防抱死制动系统...</p>
                <p>- ESP = 电子稳定程序...</p>
                <p>- 还有其他40个常用汽车电路术语</p>
              </div>
              <p>• <strong>相关度排序：</strong>标题 &gt; 描述 &gt; 文本</p>
              <p>• <strong>点击跳转：</strong>点击搜索结果自动跳转到对应页面</p>
              <p>• <strong>快速导航：</strong>使用上/下按钮快速切换结果</p>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <h5 className="font-medium text-sm mb-2">当前搜索统计</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 总计找到 {searchResults.length} 个匹配项</p>
                  <p>• 涉及 {new Set(searchResults.map(r => r.pageNumber)).size} 个页面</p>
                  <p>• 当前查看第 {currentSearchIndex >= 0 ? currentSearchIndex + 1 : 0} 个结果</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <SearchablePDFViewer
            fileUrl={document.file_path}
            fileName={document.original_name}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
            onPageChange={setCurrentPage}
            totalPages={document.page_count}
            currentPageGroupedCount={getCurrentPageGroupedCount()}
            targetPage={currentPage}
            jumpTrigger={jumpTrigger}
          />
        </div>
      </div>
    </div>
  )
}