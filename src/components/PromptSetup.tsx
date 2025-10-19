import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send } from 'lucide-react';

interface PromptSetupProps {
  onComplete: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  "SWE internships for freshmen in Silicon Valley",
  "Remote data science internships for sophomores",
  "Product management internships at startups",
  "Machine learning internships with competitive pay",
];

export default function PromptSetup({ onComplete }: PromptSetupProps) {
  const [prompt, setPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onComplete(prompt.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Find Your Perfect Internship
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Describe the internship you're looking for and we'll find opportunities that match
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden transition-all duration-300 hover:border-blue-500/50 focus-within:border-blue-500 focus-within:shadow-blue-500/20">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Example: SWE internships for freshmen with no prior experience required..."
              rows={4}
              className={`w-full px-6 py-5 bg-transparent text-white placeholder-slate-400 focus:outline-none resize-none text-lg transition-all ${
                isTyping ? 'animate-pulse' : ''
              }`}
            />
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
              <div className="text-sm text-slate-400">
                Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Enter</kbd> to search
              </div>
              <button
                type="submit"
                disabled={!prompt.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                  prompt.trim()
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Search</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <p className="text-sm text-slate-400 mb-4 text-center">Try these examples:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLE_PROMPTS.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="px-5 py-3.5 bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600 rounded-xl text-left text-sm text-slate-300 transition-all hover:scale-102 hover:shadow-lg"
              >
                <span className="text-blue-400 mr-2">→</span>
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center animate-in fade-in duration-700 delay-500">
          <p className="text-xs text-slate-500">
            Powered by intelligent search • Filter by role, location, eligibility, and more
          </p>
        </div>
      </div>
    </div>
  );
}
