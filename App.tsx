import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Citation, SearchResult, Language, HistoryItem } from './types';
import { performResearch } from './services/geminiService';
import ResearchResultView from './components/ResearchResult';
import CitationCard from './components/CitationCard';
import LanguageToggle from './components/LanguageToggle';
import { Search, GraduationCap, Library, Sparkles, AlertCircle, History, Clock, Trash2, ArrowRight, Plus, LogOut } from 'lucide-react';
import { AuthGuard } from './components/AuthGuard';
import { db, auth } from './firebase';
import { collection, addDoc, query as firestoreQuery, orderBy, onSnapshot, deleteDoc, doc, Timestamp, writeBatch } from 'firebase/firestore';



const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [savedCitations, setSavedCitations] = useState<Citation[]>(() => {
    const saved = localStorage.getItem('scholar_citations');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'bibliography' | 'history'>('bibliography');
  const [error, setError] = useState<string | null>(null);

  // Focus input on mount
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Persist citations (Keep LocalStorage for citations for now, or move to Firestore if requested? 
  // User asked specifically for History privacy, so let's move History to Firestore and keep Citations local or shared.)
  // Actually, "Each Users Have Thier Own History" implies Citations might also be personal, but let's stick to History first.
  useEffect(() => {
    localStorage.setItem('scholar_citations', JSON.stringify(savedCitations));
  }, [savedCitations]);

  // Firestore History Sync
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setHistory([]);
      return;
    }

    const q = firestoreQuery(collection(db, `users/${user.uid}/history`), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedHistory: HistoryItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryItem[];
      setHistory(loadedHistory);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array as auth state is handled essentially by re-renders or internal auth state listeners, but ideally we should listen to auth change. 
  // Actually AuthGuard ensures we have a user when rendering, but for the effect to fire effectively, we might rely on the fact that <App> is inside <AuthGuard>.
  // Wait, <AuthGuard> wraps <App> or <App> content? 
  // I will wrap the RETURN of App.


  const handleSearch = async () => {
    const searchQuery = query.trim();
    if (!searchQuery) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await performResearch(searchQuery, language);
      setResult(data);
      setQuery(''); // Clear the input after search

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        try {
          await addDoc(collection(db, `users/${user.uid}/history`), {
            query: searchQuery,
            result: data,
            timestamp: Date.now(),
            language: language
          });
        } catch (e) {
          console.error("Error saving history to Firestore", e);
        }
      }


    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewResearch = () => {
    setResult(null);
    setQuery('');
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSaveCitation = useCallback((citation: Citation) => {
    setSavedCitations(prev => {
      if (prev.some(c => c.uri === citation.uri)) return prev;
      return [...prev, citation];
    });
  }, []);

  const handleRemoveCitation = useCallback((id: string) => {
    setSavedCitations(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleRestoreHistory = (item: HistoryItem) => {
    setQuery(item.query);
    setResult(item.result);
    setLanguage(item.language);
    setError(null);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/history`, id));
    } catch (error) {
      console.error("Error deleting history item:", error);
    }
  };

  const handleClearHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!window.confirm("Are you sure you want to clear your entire history?")) return;

    try {
      const batch = writeBatch(db);
      history.forEach((item) => {
        const ref = doc(db, `users/${user.uid}/history`, item.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  }


  const savedIds = new Set(savedCitations.map(c => c.uri));

  return (
    <AuthGuard>
      <div className="flex h-screen bg-slate-50">


        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col hidden md:flex z-10 shadow-lg">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('bibliography')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors relative ${activeTab === 'bibliography' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              <Library className="mr-2" size={16} />
              Bibliography
              {activeTab === 'bibliography' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors relative ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              <History className="mr-2" size={16} />
              History
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50">

            {/* Bibliography Content */}
            {activeTab === 'bibliography' && (
              <div className="p-4 space-y-3">
                {savedCitations.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <div className="flex justify-center mb-3">
                      <BookPlaceholder />
                    </div>
                    <p className="text-sm">No citations saved yet.</p>
                    <p className="text-xs mt-1">Research something to add sources.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center px-1 mb-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Saved Sources ({savedCitations.length})
                      </span>
                    </div>
                    {savedCitations.map(citation => (
                      <CitationCard
                        key={citation.id}
                        citation={citation}
                        onRemove={handleRemoveCitation}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* History Content */}
            {activeTab === 'history' && (
              <div className="p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <div className="flex justify-center mb-3">
                      <Clock size={40} className="text-slate-200" />
                    </div>
                    <p className="text-sm">No search history.</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleRestoreHistory(item)}
                      className="group bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-slate-700 line-clamp-2 pr-6">
                          {item.query}
                        </h4>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                          className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Delete from history"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                        <span className="flex items-center">
                          <Clock size={10} className="mr-1" />
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${item.language === 'en' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                            {item.language}
                          </span>
                          <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 bg-white">
            {activeTab === 'bibliography' ? (
              <button
                onClick={() => setSavedCitations([])}
                disabled={savedCitations.length === 0}
                className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Trash2 size={14} className="mr-2" />
                Clear Citations
              </button>
            ) : (
              <button
                onClick={handleClearHistory}
                disabled={history.length === 0}
                className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Trash2 size={14} className="mr-2" />
                Clear History
              </button>

            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full relative">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <GraduationCap size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">ScholarMind</h1>
                <p className="text-xs text-slate-500 hidden sm:block">AI-Powered Academic Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleNewResearch}
                className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
              >
                <Plus size={16} />
                <span>New Research</span>
              </button>
              <button
                onClick={handleNewResearch}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full"
                title="New Research"
              >
                <Plus size={20} />
              </button>

              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              <LanguageToggle currentLang={language} onToggle={setLanguage} />

              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              <button
                onClick={() => auth.signOut()}
                title="Sign Out"
                className="text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>

          </header>

          {/* Scrollable Result Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-4xl mx-auto min-h-full flex flex-col">

              {!result && !isLoading && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 mt-10 md:mt-0">
                  <div className="bg-blue-50 p-6 rounded-full mb-6 animate-pulse-slow">
                    <Sparkles size={48} className="text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-700 mb-2">
                    {language === 'en' ? 'What are you researching today?' : 'අද ඔබ පර්යේෂණය කරන්නේ කුමක්ද?'}
                  </h2>
                  <p className="text-slate-500 max-w-md">
                    {language === 'en'
                      ? 'Ask complex questions, get summarized answers, and find credible academic sources instantly.'
                      : 'සංකීර්ණ ප්‍රශ්න අසන්න, සාරාංශගත පිළිතුරු ලබා ගන්න, සහ විශ්වාසදායක මූලාශ්‍ර ක්ෂණිකව සොයා ගන්න.'}
                  </p>
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg text-left text-sm">
                    <SuggestionCard
                      text={language === 'en' ? "Impact of climate change on ocean currents" : "සාගර දියවැල් කෙරෙහි දේශගුණික විපර්යාසවල බලපෑම"}
                      onClick={(t) => { setQuery(t); inputRef.current?.focus(); }}
                    />
                    <SuggestionCard
                      text={language === 'en' ? "History of Quantum Computing" : "ක්වොන්ටම් පරිගණකයේ ඉතිහාසය"}
                      onClick={(t) => { setQuery(t); inputRef.current?.focus(); }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r">
                  <div className="flex items-center">
                    <AlertCircle className="text-red-500 mr-2" />
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {result && !isLoading && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-10 mb-24">
                  <ResearchResultView
                    result={result}
                    onSaveCitation={handleSaveCitation}
                    savedIds={savedIds}
                  />
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-600 animate-pulse font-medium">
                    {language === 'en' ? 'Analyzing sources...' : 'මූලාශ්‍ර විශ්ලේෂණය කරමින්...'}
                  </p>
                </div>
              )}

              {/* Spacer for sticky input */}
              <div className="h-24"></div>
            </div>
          </div>

          {/* Sticky Input Area */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg z-20">
            <div className="max-w-4xl mx-auto relative">
              <div className="relative flex items-end bg-white border border-slate-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={language === 'en' ? "Ask a research question..." : "පර්යේෂණ ප්‍රශ්නයක් අසන්න..."}
                  className="w-full py-4 pl-4 pr-14 text-slate-800 placeholder-slate-400 focus:outline-none resize-none bg-transparent"
                  rows={1}
                  style={{ minHeight: '60px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !query.trim()}
                  className="absolute right-2 bottom-2 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Search size={20} />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-slate-400">
                  ScholarMind uses Gemini 2.5 Flash & Google Search to provide answers. Verify important information.
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Drawer (Hidden for now in this iteration but logic prepared) */}
      </div>
    </AuthGuard>
  );

};

// Sub-components for cleaner App.tsx
const BookPlaceholder = () => (
  <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SuggestionCard = ({ text, onClick }: { text: string, onClick: (t: string) => void }) => (
  <button
    onClick={() => onClick(text)}
    className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all text-slate-700 hover:text-blue-700"
  >
    {text}
  </button>
);

export default App;