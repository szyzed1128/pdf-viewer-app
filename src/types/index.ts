export interface PDFDocument {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  uploadDate: Date;
  fileSize: number;
  pageCount?: number;
  extractedText?: string;
}

export interface SearchResult {
  pageNumber: number;
  text: string;
  context: string;
  relevanceScore: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  type: 'title' | 'description' | 'table' | 'text';
}

export interface SearchRequest {
  query: string;
  documentId: string;
  includeSynonyms?: boolean;
}

export interface Synonym {
  term: string;
  synonyms: string[];
}

export interface PDFViewerState {
  scale: number;
  currentPage: number;
  totalPages: number;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  searchQuery: string;
}