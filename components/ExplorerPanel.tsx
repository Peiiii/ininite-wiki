import React from 'react';
import {
    MiniSpinner, CheckCircleIcon, AlertCircleIcon, XCircleIcon, RefreshIcon, CompassIcon,
    HistoryIcon, QueueListIcon
} from './icons';
import { Task } from '../App';

interface ExplorerPanelProps {
    tasks: { [key: string]: Task };
    viewedTopics: string[];
    currentTopic: string | null;
    onNavigateFromQueue: (topic: string) => void;
    onJumpToTopic: (topic: string) => void;
    onRetry: (topic: string) => void;
    onDismiss: (topic: string) => void;
}

const TaskItem: React.FC<{
    topic: string;
    task: Task;
    onNavigate: (topic:string) => void;
    onRetry: (topic: string) => void;
    onDismiss: (topic: string) => void;
}> = ({ topic, task, onNavigate, onRetry, onDismiss }) => {
    const renderStatusIcon = () => {
        switch (task.status) {
            case 'loading': return <MiniSpinner className="flex-shrink-0" />;
            case 'ready': return <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />;
            case 'error': return <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />;
        }
    };

    return (
        <div className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded-md transition-colors duration-200 group text-sm">
            <div className="flex items-center space-x-3 truncate">
                {renderStatusIcon()}
                <span className="truncate text-gray-300">{topic}</span>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {task.status === 'ready' && (
                    <button onClick={() => onNavigate(topic)} className="p-1 text-gray-400 hover:text-white" title="Explore this topic">
                        <CompassIcon className="w-5 h-5" />
                    </button>
                )}
                {task.status === 'error' && (
                     <button onClick={() => onRetry(topic)} className="p-1 text-gray-400 hover:text-white" title="Retry">
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                )}
                <button onClick={() => onDismiss(topic)} className="p-1 text-gray-400 hover:text-white" title="Dismiss">
                    <XCircleIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


export const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
    tasks, viewedTopics, currentTopic, onNavigateFromQueue, onJumpToTopic, onRetry, onDismiss
}) => {
    const queueTopics = Object.entries(tasks);
    const reversedViewedTopics = [...viewedTopics].reverse();

    return (
        <aside className="bg-gray-900/60 backdrop-blur-md border-r border-gray-700/50 flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
                <h2 className="text-xl font-bold text-white">Explorer</h2>
            </div>
            <div className="flex-grow overflow-y-auto">
                <section className="p-4">
                    <h3 className="flex items-center space-x-2 text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        <QueueListIcon className="w-5 h-5" />
                        <span>Exploration Queue</span>
                    </h3>
                    <div className="space-y-1">
                        {queueTopics.length > 0 ? (
                            queueTopics.map(([topic, task]) => (
                                <TaskItem
                                    key={topic}
                                    topic={topic}
                                    task={task}
                                    onNavigate={onNavigateFromQueue}
                                    onRetry={onRetry}
                                    onDismiss={onDismiss}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic px-2">Click links in articles to add them here.</p>
                        )}
                    </div>
                </section>

                <section className="p-4 border-t border-gray-700/50">
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
        </aside>
    );
};