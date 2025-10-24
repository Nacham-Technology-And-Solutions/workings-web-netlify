
import React, { useState } from 'react';
import { getAIInsight } from '../services/geminiService';
import { SparklesIcon, SendIcon } from './icons/IconComponents';

const AIAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuery = async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await getAIInsight(query);
      setResponse(result);
    } catch (e) {
      setError('Failed to get response from AI. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <SparklesIcon />
        <h4 className="font-semibold text-slate-200">AI Assistant</h4>
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          placeholder="Ask about materials, codes..."
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 pr-10 text-sm text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          disabled={isLoading}
        />
        <button
          onClick={handleQuery}
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-sky-400 disabled:text-slate-600"
        >
          <SendIcon />
        </button>
      </div>
      {(isLoading || error || response) && (
        <div className="mt-3 p-3 bg-slate-900/70 rounded-md text-sm max-h-40 overflow-y-auto">
          {isLoading && <p className="text-slate-400 animate-pulse">Thinking...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {response && <div className="text-slate-300 prose prose-sm prose-invert" dangerouslySetInnerHTML={{__html: response.replace(/\n/g, '<br />')}}></div>}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
