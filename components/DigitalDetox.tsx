import React, { useState, useEffect } from 'react';
import { Trophy, Smartphone, Upload, LogIn, Award, Crown, Loader2, CheckCircle, AlertCircle, Shield, X, User } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { detoxLogin, uploadScreenTime, getLeaderboard, getMonthlyChampion, hasUploadedToday, clearDetoxData } from '../services/storageService';
import { analyzeScreenTimeScreenshot } from '../services/geminiService';
import { UserProfile } from '../types';

interface DigitalDetoxProps {
  onClose: () => void;
}

export const DigitalDetox: React.FC<DigitalDetoxProps> = ({ onClose }) => {
  // State
  const [step, setStep] = useState<'LOGIN' | 'DASHBOARD'>('LOGIN');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Dashboard Data
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [champion, setChampion] = useState<UserProfile | null>(null);
  const [uploadedToday, setUploadedToday] = useState(false);
  
  // Upload State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{points: number, hours: number} | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // Check if previously logged in (simple session persistence)
    try {
      const storedEmail = sessionStorage.getItem('detox_email');
      const storedName = sessionStorage.getItem('detox_name');
      if (storedEmail && storedName) {
        handleLogin(storedEmail, storedName);
      }
    } catch (e) {
      console.error("Session restoration failed", e);
    }
    refreshData();
    window.addEventListener('detox-update', refreshData);
    
    return () => {
        window.removeEventListener('detox-update', refreshData);
    };
  }, []);

  const refreshData = () => {
    setLeaderboard(getLeaderboard());
    setChampion(getMonthlyChampion());
    if (currentUser) {
      setUploadedToday(hasUploadedToday(currentUser.email));
      const freshUsers = getLeaderboard();
      const me = freshUsers.find(u => u.email === currentUser.email);
      if (me) setCurrentUser(me);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    handleLogin(email, name);
  };

  const handleLogin = (uEmail: string, uName: string) => {
    setLoginError(null);
    try {
      const user = detoxLogin(uEmail, uName);
      setCurrentUser(user);
      sessionStorage.setItem('detox_email', uEmail);
      sessionStorage.setItem('detox_name', uName);
      setUploadedToday(hasUploadedToday(uEmail));
      setStep('DASHBOARD');
      refreshData();
    } catch (err: any) {
      console.error(err);
      setLoginError("Could not join: " + (err.message || "Storage error. Please clear browser data."));
    }
  };

  const handleReset = () => {
    if (confirm("This will clear all Digital Detox local data (users, logs, points) from this browser. This helps if you are stuck. Proceed?")) {
      clearDetoxData();
      setLoginError(null);
      setStep('LOGIN');
      setLeaderboard([]);
      setChampion(null);
      alert("Data cleared. Please try joining again.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 2 * 1024 * 1024) {
       setErrorMsg("File is too large. Please upload an image smaller than 2MB.");
       return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setUploadResult(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const analysis = await analyzeScreenTimeScreenshot(base64String);
        
        if (!analysis.valid) {
          setErrorMsg("That doesn't look like a valid Screen Time screenshot. Please upload a clear image of your daily usage dashboard.");
          setIsAnalyzing(false);
          return;
        }

        try {
          const result = uploadScreenTime(currentUser.email, analysis.hours, base64String);
          setUploadResult({ points: result.points, hours: analysis.hours });
          setUploadedToday(true);
        } catch (err: any) {
          setErrorMsg(err.message);
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to process image.");
      setIsAnalyzing(false);
    }
    e.target.value = '';
  };

  const renderLogin = () => (
    <div className="text-center space-y-6 animate-in fade-in duration-500 relative">
      <div className="mx-auto w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-indigo-500/50">
        <Smartphone className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">Digital Detox Challenge</h2>
      <p className="text-slate-400">Reduce screen time, earn points! (Local Challenge)</p>
      
      <form onSubmit={handleLoginSubmit} className="space-y-4 text-left max-w-sm mx-auto">
        <div>
           <label className="block text-xs font-medium text-slate-400 mb-1">Your Name</label>
           <div className="relative">
               <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
               <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                   placeholder="Name"
                   required
               />
           </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="secure@example.com"
            required
          />
        </div>

        {loginError && (
          <div className="space-y-3">
             <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 text-red-400 text-xs animate-in shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {loginError}
            </div>
            <button 
              type="button" 
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-red-400 underline"
            >
              Reset Detox Data & Try Again
            </button>
          </div>
        )}

        <Button fullWidth type="submit" className="shadow-indigo-500/50">
          <LogIn className="w-4 h-4" /> Start Challenge
        </Button>
      </form>
      
      <button 
         onClick={onClose} 
         className="absolute -top-6 -right-6 md:-right-12 text-slate-500 hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );

  const renderDashboard = () => (
    <div className="grid md:grid-cols-2 gap-6 animate-in slide-in-from-right duration-500 relative">
      <button 
         onClick={onClose} 
         className="absolute -top-4 -right-2 md:-right-4 text-slate-500 hover:text-white z-20"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Left Column: Stats & Upload */}
      <div className="space-y-6">
        {/* User Card */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back,</p>
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                  {currentUser?.name}
                  {currentUser?.name.toLowerCase() === 'admin' && <Shield className="w-5 h-5 text-indigo-300" />}
                </h2>
              </div>
              <Button variant="outline" onClick={() => {
                sessionStorage.removeItem('detox_email');
                sessionStorage.removeItem('detox_name');
                setStep('LOGIN');
              }} className="!py-1 !px-2 text-xs !bg-indigo-700 !border-indigo-500 text-indigo-200 hover:text-white">
                Log Out
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-xs uppercase opacity-80">Total Points</p>
                <p className="text-2xl font-bold">{currentUser?.totalPoints}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-xs uppercase opacity-80">Rank</p>
                <p className="text-2xl font-bold">#{leaderboard.findIndex(u => u.email === currentUser?.email) + 1}</p>
              </div>
            </div>
          </div>
          <Trophy className="absolute -right-6 -bottom-6 w-48 h-48 text-indigo-500 opacity-50 rotate-12" />
        </div>

        {/* Upload Area */}
        <Card className="border-dashed border-2 border-slate-600 bg-slate-800/30">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" /> Upload Daily Screenshot
          </h3>
          
          {uploadedToday ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-emerald-400 font-bold mb-2">You're done for today!</h4>
              <p className="text-slate-400 text-sm">Come back tomorrow to log your progress.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4 text-center animate-in zoom-in">
                  <p className="text-emerald-400 font-bold text-lg">+{uploadResult.points} Points!</p>
                  <p className="text-slate-300 text-sm">Detected {uploadResult.hours} hours of screen time.</p>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4 flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {isAnalyzing ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">AI is analyzing your screenshot...</p>
                </div>
              ) : (
                <label className="block w-full cursor-pointer group">
                  <div className="flex flex-col items-center justify-center w-full h-32 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-600 group-hover:border-indigo-500">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 mb-2" />
                    <p className="text-sm text-slate-400 group-hover:text-white">Click to upload screenshot</p>
                    <p className="text-xs text-slate-500 mt-1">Max 1 upload per day</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Right Column: Leaderboard */}
      <div className="space-y-6">
        {/* Champion Card */}
        {champion && (
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-yellow-500 p-3 rounded-full shadow-lg shadow-yellow-500/40">
                <Crown className="w-8 h-8 text-black" />
              </div>
              <div>
                <p className="text-yellow-200 text-xs font-bold uppercase tracking-widest mb-1">Local Champion</p>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                   {champion.name}
                </h3>
                <p className="text-yellow-400/80 text-sm">{champion.totalPoints} Points</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          </div>
        )}

        {/* Leaderboard Table */}
        <Card className="flex-1 min-h-[300px] relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" /> Leaderboard
             </h3>
          </div>
          
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {leaderboard.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No participants yet. Be the first!</p>
            ) : (
              leaderboard.map((user, index) => (
                <div 
                  key={user.email} 
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    user.email === currentUser?.email 
                      ? 'bg-indigo-500/20 border-indigo-500/50' 
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-slate-400 text-black' :
                      index === 2 ? 'bg-orange-700 text-white' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                        <span className={`font-medium ${user.email === currentUser?.email ? 'text-indigo-300' : 'text-slate-300'}`}>
                        {user.name} {user.email === currentUser?.email && '(You)'}
                        </span>
                    </div>
                  </div>
                  <span className="font-bold text-white">{user.totalPoints}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8">
        {step === 'LOGIN' ? renderLogin() : renderDashboard()}
      </div>
    </div>
  );
};