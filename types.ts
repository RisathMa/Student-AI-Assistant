export interface Citation {
  id: string;
  title: string;
  uri: string;
  snippet?: string;
  source?: string;
}

export interface SearchResult {
  text: string;
  sources: Citation[];
}

export type Language = 'en' | 'si';

export interface Message {
  role: 'user' | 'model';
  content: string;
  sources?: Citation[];
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  query: string;
  result: SearchResult;
  timestamp: number;
  language: Language;
}