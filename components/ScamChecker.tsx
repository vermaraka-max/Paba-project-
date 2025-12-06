import React, { useState } from 'react';
import { ScanSearch, X, Search, ShieldCheck, AlertTriangle, Skull, Loader2, ExternalLink } from 'lucide-react';
import { analyzeScamRisk, ScamAnalysisResult } from '../services/geminiService';

export const ScamChecker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setResult(null);
    try {
      const data = await analyzeScamRisk(input);
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'SAFE': return 'bg-emerald-500 text-white';
      case 'DANGEROUS': return 'bg-red-500 text-white';
      case 'CAUTION': return 'bg-yellow-500 text-black';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'SAFE': return <ShieldCheck className="w-6 h-6" />;
      case 'DANGEROUS': return <Skull className="w-6 h-6" />;
      case 'CAUTION': return <AlertTriangle className="w-6 h-6" />;
      default: return <Search className="w-6 h-6" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/30 hover:scale-105"
        title="Scam Link/Number Checker"
      >
        {isOpen ? <X className="w-6 h-6" /> : <ScanSearch className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-6 w-[calc(100vw-3rem)] md:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in max-h-[70vh]">
          {/* Header */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <ScanSearch className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Scam Detector</h3>
              <p className="text-xs text-slate-400">Background Check Tool</p>
            </div>
          </div>

          <div className="p-4 overflow-y-auto">
            <form onSubmit={handleCheck} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Paste Link or Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="+1 (555)... or http://..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  {input && (
                    <button 
                      type="button" 
                      onClick={() => { setInput(''); setResult(null); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isLoading ? 'Scanning...' : 'Run Check'}
              </button>
            </form>

            {/* Results Area */}
            {result && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${getRiskColor(result.riskLevel)}`}>
                  {getRiskIcon(result.riskLevel)}
                  <div>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Risk Level</p>
                    <p className="text-lg font-bold">{result.riskLevel}</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Analysis Report</h4>
                  <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {result.explanation}
                  </div>
                </div>

                {result.sources.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Sources Found</h4>
                    <div className="space-y-2">
                      {result.sources.slice(0, 3).map((source, i) => (
                        <a 
                          key={i} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{source.title || source.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!result && !isLoading && (
              <div className="mt-6 text-center p-4 border border-dashed border-slate-700 rounded-xl">
                <p className="text-xs text-slate-500">
                  We verify against known scam databases and recent reports found via Google Search.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};