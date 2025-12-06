import React, { useState, useEffect } from 'react';
import { Shield, User, ChevronRight, Loader2, AlertTriangle, Lock, CheckCircle2, Award, RefreshCw, Megaphone, Ban } from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { ChatBot } from './components/ChatBot';
import { AskAdmin } from './components/AskAdmin';
import { ScamChecker } from './components/ScamChecker';
import { AdminDashboard } from './components/AdminDashboard';
import { AppState, LiteracyLevel, Question, QuizResult, UserAnswer } from './types';
import { generateQuizQuestions, evaluateQuiz } from './services/geminiService';
import { getGlobalMessage, isUserBlocked, logVisitor } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('WELCOME');
  const [userName, setUserName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);
  const [blockError, setBlockError] = useState(false);

  // Admin Auth State
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    // Check global message on mount
    const checkGlobalMsg = () => setGlobalMsg(getGlobalMessage());
    checkGlobalMsg();
    window.addEventListener('storage-update', checkGlobalMsg);
    return () => window.removeEventListener('storage-update', checkGlobalMsg);
  }, []);

  // Handlers
  const startQuiz = async () => {
    if (!userName.trim()) return;

    // Check for Admin Login
    if (userName.trim().toLowerCase() === 'admin') {
      setAppState('ADMIN_AUTH');
      setAuthError(false);
      setAdminPassword('');
      return;
    }

    // Check Blocked Status
    if (isUserBlocked(userName)) {
      setBlockError(true);
      return;
    }
    setBlockError(false);
    
    // Log user as active
    logVisitor(userName);

    setAppState('LOADING_QUIZ');
    try {
      const generatedQuestions = await generateQuizQuestions();
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setAppState('QUIZ');
    } catch (e) {
      console.error(e);
      setAppState('ERROR');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '67') {
      setAppState('ADMIN_MODE');
      setAdminPassword('');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleAnswerSelect = async (optionText: string) => {
    // Keep user logged as active during quiz
    logVisitor(userName);

    const currentQ = questions[currentQuestionIndex];
    const newAnswer: UserAnswer = {
      questionId: currentQ.id,
      questionText: currentQ.text,
      selectedOptionText: optionText
    };
    
    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState('ANALYZING');
      const analysis = await evaluateQuiz(updatedAnswers);
      setResult(analysis);
      setAppState('RESULT');
    }
  };

  const resetApp = () => {
    setAppState('WELCOME');
    setUserName('');
    setQuestions([]);
    setUserAnswers([]);
    setResult(null);
    setCurrentQuestionIndex(0);
    setBlockError(false);
    setAdminPassword('');
  };

  // Render Helpers
  const renderWelcome = () => (
    <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-500/20 rounded-full mb-6 ring-1 ring-indigo-500/50">
          <Shield className="w-12 h-12 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">
          CyberShield
        </h1>
        <p className="text-slate-400">
          Online Scams Digital Literacy Project
        </p>
      </div>

      <Card>
        {globalMsg && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
            <Megaphone className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200">{globalMsg}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300 ml-1">
              Enter your name to begin
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setBlockError(false);
                }}
                placeholder="Your Name (Enter 'admin' for Dashboard)"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {blockError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in shake">
              <Ban className="w-4 h-4" />
              <span>Access denied. This user has been blocked.</span>
            </div>
          )}
          
          <Button 
            fullWidth 
            onClick={startQuiz}
            disabled={!userName.trim() || blockError}
          >
            {userName.trim().toLowerCase() === 'admin' ? 'Login as Admin' : 'Start Assessment'}
            <ChevronRight className="w-5 h-5" />
          </Button>
          
          <p className="text-xs text-center text-slate-500">
            We only use your name for the report. No other personal data is collected.
          </p>
        </div>
      </Card>
    </div>
  );

  const renderAdminAuth = () => (
    <div className="max-w-md w-full animate-in zoom-in duration-300">
      <Card>
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-500/20 rounded-full mb-4 ring-1 ring-red-500/50">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Authentication</h2>
          <p className="text-slate-400 text-sm">Restricted access area.</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300 ml-1">
              Password
            </label>
            <input 
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          {authError && (
            <p className="text-red-400 text-sm text-center">Incorrect password. Please try again.</p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setAppState('WELCOME')} fullWidth>
              Cancel
            </Button>
            <Button type="submit" fullWidth className="!bg-red-600 hover:!bg-red-500 !shadow-red-500/30">
              Unlock Dashboard
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderLoading = (text: string) => (
    <div className="text-center animate-in fade-in duration-500">
      <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6" />
      <h2 className="text-2xl font-semibold text-white mb-2">{text}</h2>
      <p className="text-slate-400">Powered by AI Analysis...</p>
    </div>
  );

  const renderQuiz = () => {
    const question = questions[currentQuestionIndex];
    return (
      <div className="max-w-2xl w-full animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-slate-500 text-sm">
            Evaluating {userName}
          </span>
        </div>

        <Card>
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed">
            {question.text}
          </h2>

          <div className="space-y-4">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.text)}
                className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-indigo-600/20 hover:border-indigo-500/50 hover:text-white text-slate-300 transition-all duration-200 group flex items-start"
              >
                <div className="mt-1 w-5 h-5 rounded-full border border-slate-600 group-hover:border-indigo-400 mr-4 flex-shrink-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span>{option.text}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    const levelColor = {
      [LiteracyLevel.NEW]: "text-red-400",
      [LiteracyLevel.INTERMEDIATE]: "text-yellow-400",
      [LiteracyLevel.EXPERIENCED]: "text-blue-400",
      [LiteracyLevel.MASTER]: "text-emerald-400",
    };

    const LevelIcon = {
      [LiteracyLevel.NEW]: AlertTriangle,
      [LiteracyLevel.INTERMEDIATE]: Lock,
      [LiteracyLevel.EXPERIENCED]: CheckCircle2,
      [LiteracyLevel.MASTER]: Award,
    }[result.level];

    return (
      <div className="max-w-xl w-full animate-in zoom-in duration-500">
        <Card className="text-center relative overflow-hidden">
          {/* Background decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-4 bg-slate-800 rounded-full mb-6 ring-4 ring-slate-700/50">
              <LevelIcon className={`w-12 h-12 ${levelColor[result.level]}`} />
            </div>

            <h2 className="text-slate-400 font-medium mb-1">Assessment Complete</h2>
            <h1 className="text-3xl font-bold text-white mb-6">
              Hi {userName}, you are a <br/>
              <span className={`text-4xl ${levelColor[result.level]} block mt-2`}>
                {result.level}
              </span>
            </h1>

            <div className="w-full bg-slate-700 rounded-full h-4 mb-8 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  result.level === LiteracyLevel.MASTER ? 'bg-emerald-500' : 
                  result.level === LiteracyLevel.EXPERIENCED ? 'bg-blue-500' :
                  result.level === LiteracyLevel.INTERMEDIATE ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>

            <div className="bg-slate-900/50 rounded-xl p-6 mb-8 text-left border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                AI Analysis Feedback
              </h3>
              <p className="text-slate-200 leading-relaxed">
                {result.feedback}
              </p>
            </div>

            <Button onClick={resetApp} variant="outline" fullWidth>
              <RefreshCw className="w-4 h-4" />
              Start New Assessment
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-4 md:p-8 relative">
      
      {appState === 'ADMIN_MODE' ? (
        <AdminDashboard onLogout={resetApp} />
      ) : (
        <>
          {appState === 'WELCOME' && renderWelcome()}
          {appState === 'ADMIN_AUTH' && renderAdminAuth()}
          {appState === 'LOADING_QUIZ' && renderLoading("Generating Scenarios...")}
          {appState === 'QUIZ' && renderQuiz()}
          {appState === 'ANALYZING' && renderLoading("Analyzing Your Responses...")}
          {appState === 'RESULT' && renderResult()}
          {appState === 'ERROR' && (
            <div className="text-center text-red-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p>Something went wrong. Please refresh the page.</p>
            </div>
          )}

          {/* User Support Tools */}
          <AskAdmin currentUserName={userName} />
          <ChatBot />
          <ScamChecker />
        </>
      )}

      {/* Permanent Footer */}
      <div className="fixed bottom-2 w-full text-center pointer-events-none z-10">
        <p className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest font-medium opacity-60">
          Made by Shreshtha Tuff
        </p>
      </div>
    </div>
  );
};

export default App;