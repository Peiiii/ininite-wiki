import React from 'react';
import {
    HistoryIcon,
    XIcon,
} from './icons';

interface ExplorerPanelProps {
    viewedTopics: string[];
    currentTopic: string | null;
    onJumpToTopic: (topic: string) => void;
    onClose?: () => void;
}

export const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
    viewedTopics, currentTopic, onJumpToTopic, onClose
}) => {
    const reversedViewedTopics = [...viewedTopics].reverse();

    return (
        <div className="bg-transparent flex flex-col h-full overflow-y-auto w-full">
            <div className="p-4 border-b border-gray-700/50 flex-shrink-0 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Explorer</h2>
                {onClose && (
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white">
                        <XIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
            <div className="flex-grow overflow-y-auto">
                <section className="p-4">
                    <h3 className="flex items-center space-x-2 text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        <HistoryIcon className="w-5 h-5" />
                        <span>Viewed History</span>
                    </h3>
                    <div className="space-y-1">
                        {reversedViewedTopics.length > 0 ? (
                             reversedViewedTopics.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => onJumpToTopic(topic)}
                                    className={`w-full text-left p-2 rounded-md transition-colors duration-200 text-sm truncate ${
                                        topic.toLowerCase() === currentTopic?.toLowerCase()
                                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                                            : 'text-gray-300 hover:bg-gray-700/50'
                                    }`}
                                >
                                    {topic}
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic px-2">Your viewed articles will appear here.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};
