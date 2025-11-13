import React, { useState, useCallback, useEffect } from 'react';
import { generateWikiArticle, generateSimpleExplanation, generateAnalogy, generateQuiz, generateImageForTopic, QuizQuestion } from './services/geminiService';
import { WikiArticle } from './components/WikiArticle';
import { HistoryTrail } from './components/HistoryTrail';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ExplorerPanel } from './components/ExplorerPanel';
import { CommandKModal } from './components/CommandKModal';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { DeepDivePanel } from './components/DeepDivePanel';
import { GraphIcon, SearchIcon, BookOpenIcon, HomeIcon } from './components/icons';

type ArticlesCache = {
  [key: string]: string;
};

interface DeepDiveContent {
  simpleExplanation?: string;
  analogy?: string;
  quiz?: QuizQuestion[];
  imageUrl?: string;
}

function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default function App() {
  const [history, setHistory] = usePersistentState<string[]>('wiki-history', []);
  const [viewedTopics, setViewedTopics] = usePersistentState<string[]>('wiki-viewedTopics', []);
  const [articles, setArticles] = usePersistentState<ArticlesCache>('wiki-articles', {});
  const [deepDiveCache, setDeepDiveCache] = usePersistentState<{ [key: string]: DeepDiveContent }>('wiki-deepDive', {});
  const [error, setError] = useState<string | null>(null);
  
  const [isCommanderOpen, setIsCommanderOpen] = useState(false);
  const [isGraphView, setIsGraphView] = useState(false);
  const [deepDiveLoading, setDeepDiveLoading] = useState({
    simple: false,
    analogy: false,
    quiz: false,
    image: false,
  });

  const isExplorerVisible = viewedTopics.length > 0;
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommanderOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentTopic = history.length > 0 ? history[history.length - 1] : null;

  const addTopicToViewed = (topic: string) => {
    setViewedTopics(prev => {
      const lowerCaseTopic = topic.toLowerCase();
      if (!prev.some(t => t.toLowerCase() === lowerCaseTopic)) {
        return [...prev, topic];
      }
      return prev;
    });
  };

  const fetchArticleForView = useCallback(async (topic: string) => {
    addTopicToViewed(topic);
    if (articles[topic.toLowerCase()]) return;

    try {
      const content = await generateWikiArticle(topic);
      setArticles(prev => ({ ...prev, [topic.toLowerCase()]: content }));
    } catch (err) {
      console.error(err);
      setError(`Failed to generate article for "${topic}". Please try another topic.`);
      setHistory(prev => prev.filter(t => t.toLowerCase() !== topic.toLowerCase()));
    }
  }, [articles, setArticles, setHistory]);

  const startNewExploration = (topic: string) => {
    if (topic.trim() === '') return;
    setError(null);
    setHistory([topic]);
    setIsGraphView(false);
  };
  
  useEffect(() => {
    if (currentTopic) {
        fetchArticleForView(currentTopic);
    }
  }, [currentTopic, fetchArticleForView]);

  const exploreTopic = (topic: string) => {
    setHistory(prev => [...prev, topic]);
    setIsGraphView(false);
  };
  
  const navigateToHistory = (index: number) => {
    setHistory(prev => prev.slice(0, index + 1));
    setIsGraphView(false);
  };
  
  const jumpToTopic = (topic: string) => {
    if (topic.toLowerCase() === currentTopic?.toLowerCase()) {
        setIsGraphView(false);
        return;
    }
    
    const existingTopicIndex = history.findIndex(t => t.toLowerCase() === topic.toLowerCase());
    if (existingTopicIndex > -1) {
        navigateToHistory(existingTopicIndex);
    } else {
        exploreTopic(topic);
    }
  };

  const goHome = () => {
    setHistory([]);
    setViewedTopics([]);
    setError(null);
    setArticles({});
    setDeepDiveCache({});
    setIsGraphView(false);
  };

  const handleDeepDive = async (type: 'simple' | 'analogy' | 'quiz' | 'image') => {
    if (!currentTopic || !currentArticleContent) return;
    
    setDeepDiveLoading(prev => ({ ...prev, [type]: true }));
    setError(null);
    const topicKey = currentTopic.toLowerCase();

    try {
      let result;
      if (type === 'simple') {
        result = await generateSimpleExplanation(currentTopic, currentArticleContent);
        setDeepDiveCache(prev => ({ ...prev, [topicKey]: { ...prev[topicKey], simpleExplanation: result } }));
      } else if (type === 'analogy') {
        result = await generateAnalogy(currentTopic, currentArticleContent);
        setDeepDiveCache(prev => ({ ...prev, [topicKey]: { ...prev[topicKey], analogy: result } }));
      } else if (type === 'quiz') {
        result = await generateQuiz(currentTopic, currentArticleContent);
        setDeepDiveCache(prev => ({ ...prev, [topicKey]: { ...prev[topicKey], quiz: result } }));
      } else if (type === 'image') {
        result = await generateImageForTopic(currentTopic);
        setDeepDiveCache(prev => ({ ...prev, [topicKey]: { ...prev[topicKey], imageUrl: result } }));
      }
    } catch (err) {
      console.error(`Error generating deep dive content for "${type}"`, err);
      setError(`Failed to generate content for "${currentTopic}". The model may be unavailable.`);
    } finally {
      setDeepDiveLoading(prev => ({ ...prev, [type]: false }));
    }
  };
  
  const currentArticleContent = currentTopic ? articles[currentTopic.toLowerCase()] : undefined;
  const currentDeepDiveContent = currentTopic ? deepDiveCache[currentTopic.toLowerCase()] : undefined;

  return (
    <div className="h-screen bg-transparent font-sans text-gray-200 flex flex-col">
      <CommandKModal 
        isOpen={isCommanderOpen}
        onClose={() => setIsCommanderOpen(false)}
        onSearch={startNewExploration}
        history={viewedTopics}
        onJump={jumpToTopic}
      />

      <header className="flex-shrink-0 h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-700/50 flex items-center justify-between px-4 sm:px-6 z-20">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
            <button onClick={goHome} className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors flex-shrink-0" aria-label="Go Home">
                <HomeIcon className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
                {history.length > 0 && <HistoryTrail history={history} onNavigate={navigateToHistory} />}
            </div>
        </div>

        <div className="flex items-center space-x-3">
            <button onClick={() => setIsCommanderOpen(true)} className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors">
                <SearchIcon className="h-5 w-5"/>
            </button>
            {isExplorerVisible && (
                <div className="flex items-center bg-gray-800/60 border border-gray-700 rounded-md p-0.5">
                    <button onClick={() => setIsGraphView(false)} className={`px-2 py-1 rounded-sm text-sm flex items-center space-x-1.5 transition-colors ${!isGraphView ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>
                        <BookOpenIcon className="h-4 w-4"/>
                        <span className="hidden md:inline">Article</span>
                    </button>
                    <button onClick={() => setIsGraphView(true)} className={`px-2 py-1 rounded-sm text-sm flex items-center space-x-1.5 transition-colors ${isGraphView ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>
                        <GraphIcon className="h-4 w-4"/>
                        <span className="hidden md:inline">Graph</span>
                    </button>
                </div>
            )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col h-full overflow-y-auto">
            <div className={`w-full h-full flex flex-col items-center ${!currentTopic ? 'justify-start pt-20' : ''}`}>
                {error && <ErrorDisplay message={error} />}
            
                {!error && currentTopic && !isGraphView && (
                    <div className="mx-auto w-full max-w-4xl flex flex-col gap-8">
                        <WikiArticle
                            topic={currentTopic}
                            content={currentArticleContent}
                            onLinkClick={exploreTopic}
                        />
                        <DeepDivePanel 
                            topic={currentTopic}
                            content={currentDeepDiveContent}
                            loadingState={deepDiveLoading}
                            onGenerate={handleDeepDive}
                        />
                    </div>
                )}

                {isGraphView && currentTopic && (
                    <KnowledgeGraph
                        viewedTopics={viewedTopics}
                        history={history}
                        onNodeClick={jumpToTopic}
                    />
                )}

                {!currentTopic && !error && <WelcomeScreen onSearch={startNewExploration} />}
            </div>
        </main>

        {isExplorerVisible && (
            <aside className="w-64 md:w-72 flex-shrink-0 bg-gray-900/30 backdrop-blur-md border-l border-gray-700/50 overflow-y-auto">
               <ExplorerPanel 
                    viewedTopics={viewedTopics}
                    currentTopic={currentTopic}
                    onJumpToTopic={jumpToTopic}
                />
            </aside>
        )}
      </div>
    </div>
  );
}
