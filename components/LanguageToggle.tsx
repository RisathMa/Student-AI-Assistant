import React from 'react';
import { Language } from '../types';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  currentLang: Language;
  onToggle: (lang: Language) => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLang, onToggle }) => {
  return (
    <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
      <div className="p-1.5 text-slate-500">
        <Globe size={16} />
      </div>
      <button
        onClick={() => onToggle('en')}
        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
          currentLang === 'en'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        English
      </button>
      <button
        onClick={() => onToggle('si')}
        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
          currentLang === 'si'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        සිංහල
      </button>
    </div>
  );
};

export default LanguageToggle;
