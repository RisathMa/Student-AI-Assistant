import React from 'react';
import ReactMarkdown from 'react-markdown';
import { SearchResult, Citation } from '../types';
import { BookOpen, Plus } from 'lucide-react';

interface ResearchResultProps {
  result: SearchResult;
  onSaveCitation: (citation: Citation) => void;
  savedIds: Set<string>;
}

const ResearchResult: React.FC<ResearchResultProps> = ({ result, onSaveCitation, savedIds }) => {
  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      {/* AI Response Content */}
      <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600">
        <ReactMarkdown>{result.text}</ReactMarkdown>
      </div>

      {/* Sources Section */}
      {result.sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
            <BookOpen size={16} className="mr-2" />
            Sources & References
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.sources.map((source) => {
                const isSaved = savedIds.has(source.id) || savedIds.has(source.uri); // Check ID or URI
                return (
                    <div 
                        key={source.id} 
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                        <div className="flex-1 min-w-0 mr-3">
                            <div className="text-sm font-medium text-slate-800 truncate" title={source.title}>
                                {source.title}
                            </div>
                            <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-slate-500 truncate block hover:text-blue-600 hover:underline"
                            >
                                {source.uri}
                            </a>
                        </div>
                        <button
                            onClick={() => onSaveCitation(source)}
                            disabled={isSaved}
                            className={`flex-shrink-0 p-2 rounded-full transition-all ${
                                isSaved 
                                ? 'bg-green-100 text-green-600 cursor-default' 
                                : 'bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                            }`}
                            title={isSaved ? "Saved" : "Save to Bibliography"}
                        >
                            {isSaved ? (
                                <span className="text-xs font-bold px-1">✓</span>
                            ) : (
                                <Plus size={16} />
                            )}
                        </button>
                    </div>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchResult;
