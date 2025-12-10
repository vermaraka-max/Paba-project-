import React, { useState } from 'react';
import { ScanSearch, X, Search, ShieldCheck, AlertTriangle, Skull, Loader2, ExternalLink, Newspaper, FileText, CheckCircle2 } from 'lucide-react';
import { analyzeScamRisk, analyzeNews, ScamAnalysisResult, NewsAnalysisResult } from '../services/geminiService';

interface ScamCheckerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ScamChecker: React.FC<ScamCheckerProps> = ({ isOpen, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState<'scam' | 'news'>('scam');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Results
  const [scamResult, setScamResult] = useState<ScamAnalysisResult | null>(null);
  const [newsResult, setNewsResult] = useState<NewsAnalysisResult | null>(null);

  const isPhoneNumberLike = (str: string) => {
    // Basic check: contains at least one digit and only contains phone-allowed chars
    return /\d/.test(str) && /^[\d\+\-\(\)\s\.]+$/.test(str);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setValidationError(null);

    if (activeTab === 'scam' && val.trim()) {
       if (isPhoneNumberLike(val)) {
           const digitCount = val.replace(/\D/g, '').length;
           if (digitCount < 10) {
               setValidationError("Please enter a valid phone number (at least 10 digits).");
           }
       }
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || validationError) return;

    setIsLoading(true);
    setScamResult(null);
    setNewsResult(null);
    
    try {
      if (activeTab === 'scam') {
        const data = await analyzeScamRisk(input);
        setScamResult(data);
      } else {
        const data = await analyzeNews(input);
        setNewsResult(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getScamRiskColor = (level: string) => {
    switch (level) {
      case 'SAFE': return 'bg-emerald-500 text-white';
      case 'DANGEROUS': return 'bg-red-500 text-white';
      case 'CAUTION': return 'bg-yellow-500 text-black';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getNewsCredibilityColor = (level: string) => {
    switch (level) {
      case 'REAL': return 'bg-emerald-500 text-white';
      case 'FAKE': return 'bg-red-500 text-white';
      case 'MISLEADING': return 'bg-orange-500 text-white';
      case 'SATIRE': return 'bg-purple-500 text-white';
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

  const getNewsIcon = (level: string) => {
    switch (level) {
      case 'REAL': return <CheckCircle2 className="w-6 h-6" />;
      case 'FAKE': return <X className="w-6 h-6" />;
      case 'MISLEADING': return <AlertTriangle className="w-6 h-6" />;
      case 'SATIRE': return <FileText className="w-6 h-6" />;
      default: return <Search className="w-6 h-6" />;
    }
  };

  const resetState = () => {
    setInput('');
    setScamResult(null);
    setNewsResult(null);
    setValidationError(null);
  };

  return (
    <>
      <button
        onClick={() => onOpenChange(!isOpen)}
        className="fixed bottom-6 left-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/30 hover:scale-105"
        title="Detector Tools"
      >
        {isOpen ? <X className="w-6 h-6" /> : <ScanSearch className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-6 w-[calc(100vw-3rem)] md:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in max-h-[75vh]">
          {/* Header */}
          <div className="bg-slate-800 p-4 border-b border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <ScanSearch className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Truth Detector</h3>
                <p className="text-xs text-slate-400">AI-Powered Verification</p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex p-1 bg-slate-950 rounded-lg">
              <button
                onClick={() => { setActiveTab('scam'); resetState(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'scam' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <ScanSearch className="w-3 h-3" /> Scam Check
              </button>
              <button
                onClick={() => { setActiveTab('news'); resetState(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'news' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Newspaper className="w-3 h-3" /> Fake News
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto">
            <form onSubmit={handleCheck} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {activeTab === 'scam' ? 'Paste Link or Phone Number' : 'Paste Headline, Claim, or Article Text'}
                </label>
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder={activeTab === 'scam' ? "+1 (555)... or http://..." : "e.g. 'Celebrity X endorses new crypto coin'..."}
                    className={`w-full bg-slate-800 border ${validationError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700'} rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none ${activeTab === 'news' ? 'h-24' : 'h-12'}`}
                  />
                  {input && (
                    <button 
                      type="button" 
                      onClick={resetState}
                      className="absolute right-3 top-3 text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {validationError && (
                  <p className="text-xs text-red-400 mt-1 animate-in slide-in-from-top-1">{validationError}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !!validationError}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isLoading ? 'Verifying...' : 'Check Now'}
              </button>
            </form>

            {/* SCAM Results Area */}
            {activeTab === 'scam' && scamResult && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${getScamRiskColor(scamResult.riskLevel)}`}>
                  {getRiskIcon(scamResult.riskLevel)}
                  <div>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Risk Level</p>
                    <p className="text-lg font-bold">{scamResult.riskLevel}</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Analysis Report</h4>
                  <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {scamResult.explanation}
                  </div>
                </div>

                {scamResult.sources.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Sources Found</h4>
                    <div className="space-y-2">
                      {scamResult.sources.slice(0, 3).map((source, i) => (
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

            {/* NEWS Results Area */}
            {activeTab === 'news' && newsResult && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${getNewsCredibilityColor(newsResult.credibility)}`}>
                  {getNewsIcon(newsResult.credibility)}
                  <div>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Verdict</p>
                    <p className="text-lg font-bold">{newsResult.credibility}</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Fact Check Analysis</h4>
                  <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {newsResult.analysis}
                  </div>
                </div>

                {newsResult.sources.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Trusted Sources</h4>
                    <div className="space-y-2">
                      {newsResult.sources.slice(0, 3).map((source, i) => (
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
            
            {!scamResult && !newsResult && !isLoading && (
              <div className="mt-6 text-center p-4 border border-dashed border-slate-700 rounded-xl">
                <p className="text-xs text-slate-500">
                  {activeTab === 'scam' 
                    ? "We check numbers & links against databases and recent scam reports."
                    : "We use AI & Google Search to verify news against trusted sources like Reuters, AP, etc."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};