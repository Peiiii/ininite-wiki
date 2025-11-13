import React from 'react';
import { Quiz } from './Quiz';
import { QuizQuestion } from '../services/geminiService';
import { MiniSpinner, FaceSmileIcon, LightBulbIcon, QuestionMarkCircleIcon, PhotoIcon } from './icons';

interface DeepDiveContent {
    simpleExplanation?: string;
    analogy?: string;
    quiz?: QuizQuestion[];
    imageUrl?: string;
}

interface LoadingState {
    simple: boolean;
    analogy: boolean;
    quiz: boolean;
    image: boolean;
}

interface DeepDivePanelProps {
    topic: string;
    content?: DeepDiveContent;
    loadingState: LoadingState;
    onGenerate: (type: 'simple' | 'analogy' | 'quiz' | 'image') => void;
}

const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isLoading: boolean;
    isDone: boolean;
}> = ({ icon, label, onClick, isLoading, isDone }) => (
    <button
        onClick={onClick}
        disabled={isLoading || isDone}
        className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-lg transition-all duration-200 w-full h-full text-center
            ${isLoading ? 'bg-gray-700/50 cursor-wait' : ''}
            ${isDone ? 'bg-cyan-900/40 border border-cyan-700/50 cursor-default' : ''}
            ${!isLoading && !isDone ? 'bg-gray-800 hover:bg-gray-700/80 border border-gray-700' : ''}
        `}
    >
        <div className="relative">
            {isLoading ? <MiniSpinner className="w-6 h-6" /> : icon}
        </div>
        <span className={`text-sm font-semibold ${isDone ? 'text-cyan-300' : 'text-gray-300'}`}>{label}</span>
    </button>
);

export const DeepDivePanel: React.FC<DeepDivePanelProps> = ({ topic, content, loadingState, onGenerate }) => {
    return (
        <div className="bg-gray-800/50 p-6 sm:p-8 rounded-lg shadow-2xl w-full animate-fade-in border border-gray-700/50 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-cyan-400">Deep Dive: <span className="text-white font-semibold">{topic}</span></h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ActionButton 
                    icon={<FaceSmileIcon className="w-6 h-6 text-cyan-400"/>} 
                    label="Explain Simply" 
                    onClick={() => onGenerate('simple')}
                    isLoading={loadingState.simple}
                    isDone={!!content?.simpleExplanation}
                />
                <ActionButton 
                    icon={<LightBulbIcon className="w-6 h-6 text-yellow-400"/>} 
                    label="Analogy" 
                    onClick={() => onGenerate('analogy')}
                    isLoading={loadingState.analogy}
                    isDone={!!content?.analogy}
                />
                <ActionButton 
                    icon={<QuestionMarkCircleIcon className="w-6 h-6 text-green-400"/>} 
                    label="Quiz Me" 
                    onClick={() => onGenerate('quiz')}
                    isLoading={loadingState.quiz}
                    isDone={!!content?.quiz}
                />
                <ActionButton 
                    icon={<PhotoIcon className="w-6 h-6 text-purple-400"/>} 
                    label="Visualize" 
                    onClick={() => onGenerate('image')}
                    isLoading={loadingState.image}
                    isDone={!!content?.imageUrl}
                />
            </div>

            <div className="space-y-4">
                {content?.simpleExplanation && (
                    <details open className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50 animate-fade-in">
                        <summary className="font-semibold text-lg cursor-pointer text-gray-200">Simplified Explanation</summary>
                        <p className="mt-2 text-gray-300 whitespace-pre-wrap">{content.simpleExplanation}</p>
                    </details>
                )}
                {content?.analogy && (
                    <details open className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50 animate-fade-in">
                        <summary className="font-semibold text-lg cursor-pointer text-gray-200">Analogy</summary>
                        <p className="mt-2 text-gray-300 whitespace-pre-wrap">{content.analogy}</p>
                    </details>
                )}
                {content?.imageUrl && (
                    <details open className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50 animate-fade-in">
                        <summary className="font-semibold text-lg cursor-pointer text-gray-200">Visualization</summary>
                        <div className="mt-3 flex justify-center">
                            <img src={content.imageUrl} alt={`AI-generated visualization for ${topic}`} className="rounded-md max-w-full h-auto max-h-96 shadow-lg" />
                        </div>
                    </details>
                )}
                {content?.quiz && (
                    <details open className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50 animate-fade-in">
                        <summary className="font-semibold text-lg cursor-pointer text-gray-200">Knowledge Check</summary>
                        <div className="mt-3">
                           <Quiz questions={content.quiz} key={topic} />
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
};
