import React from 'react';
import { Citation } from '../types';
import { ExternalLink, Trash2, Copy } from 'lucide-react';

interface CitationCardProps {
  citation: Citation;
  onRemove: (id: string) => void;
}

const CitationCard: React.FC<CitationCardProps> = ({ citation, onRemove }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(`${citation.title} - ${citation.uri}`);
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight mb-2">
          {citation.title}
        </h4>
        <button 
            onClick={() => onRemove(citation.id)}
            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove citation"
        >
            <Trash2 size={14} />
        </button>
      </div>
      
      <a 
        href={citation.uri} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline flex items-center mb-2 truncate"
      >
        <ExternalLink size={10} className="mr-1 flex-shrink-0" />
        {citation.uri}
      </a>

      <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
         <button 
            onClick={handleCopy}
            className="flex items-center text-xs text-slate-500 hover:text-blue-600 transition-colors"
         >
            <Copy size={12} className="mr-1" />
            Copy Ref
         </button>
      </div>
    </div>
  );
};

export default CitationCard;
