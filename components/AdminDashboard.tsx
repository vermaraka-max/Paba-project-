import React, { useState, useEffect } from 'react';
import { 
  getTickets, resolveTicket, deleteTicket, 
  getGlobalMessage, setGlobalMessage, 
  getBlockedUsers, blockUser, unblockUser,
  getCustomQuestions, addCustomQuestion, deleteCustomQuestion,
  getVisitors
} from '../services/storageService';
import { SupportTicket, CustomQuestion, Visitor } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { ShieldAlert, LogOut, Check, Trash2, Reply, Settings, MessageSquare, Plus, Users, Megaphone, HelpCircle, Activity, Globe } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

type Tab = 'tickets' | 'questions' | 'analytics' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  
  // Data States
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [globalMsg, setGlobalMsg] = useState('');
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  // Form States
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '']);
  
  const [blockInput, setBlockInput] = useState('');

  const loadData = () => {
    // Load Tickets
    const allTickets = getTickets();
    setTickets(allTickets.sort((a, b) => {
      if (a.status === b.status) return b.timestamp - a.timestamp;
      return a.status === 'pending' ? -1 : 1;
    }));

    // Load Custom Questions
    setCustomQuestions(getCustomQuestions());

    // Load Blocked Users
    setBlockedUsers(getBlockedUsers());

    // Load Global Message
    setGlobalMsg(getGlobalMessage() || '');

    // Load Visitors
    setVisitors(getVisitors().sort((a, b) => b.lastSeen - a.lastSeen));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // Poll for updates
    window.addEventListener('storage-update', loadData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage-update', loadData);
    };
  }, []);

  // --- Ticket Handlers ---
  const handleReply = (id: string) => {
    const text = replyText[id];
    if (!text?.trim()) return;
    resolveTicket(id, text);
    setActiveReplyId(null);
    setReplyText(prev => ({ ...prev, [id]: '' }));
  };

  const handleDeleteTicket = (id: string) => {
    if (confirm('Delete this ticket?')) deleteTicket(id);
  };

  // --- Question Handlers ---
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || newQOptions.some(o => !o.trim())) return;
    addCustomQuestion(newQText, newQOptions);
    setNewQText('');
    setNewQOptions(['', '', '']);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Delete this custom question?')) deleteCustomQuestion(id);
  };

  // --- Settings Handlers ---
  const handleSaveGlobalMsg = () => {
    setGlobalMessage(globalMsg);
    alert('Global message updated!');
  };

  const handleBlockUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockInput.trim()) {
      blockUser(blockInput);
      setBlockInput('');
    }
  };

  const handleUnblockUser = (user: string) => {
    unblockUser(user);
  };

  // Analytics Helpers
  const isActive = (timestamp: number) => {
    // Active if seen in last 5 minutes
    return Date.now() - timestamp < 5 * 60 * 1000;
  };

  const activeCount = visitors.filter(v => isActive(v.lastSeen)).length;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/50">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Manage questions, users, and alerts</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onLogout}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 pb-1 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${activeTab === 'analytics' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <Activity className="w-4 h-4" /> Analytics
        </button>
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${activeTab === 'tickets' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <MessageSquare className="w-4 h-4" /> User Tickets
        </button>
        <button 
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${activeTab === 'questions' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <HelpCircle className="w-4 h-4" /> Custom Questions
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <Settings className="w-4 h-4" /> General Settings
        </button>
      </div>

      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'analytics' && (
        <div className="grid gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="flex items-center gap-4">
               <div className="p-4 bg-emerald-500/20 rounded-full">
                 <Globe className="w-8 h-8 text-emerald-400" />
               </div>
               <div>
                 <p className="text-slate-400 text-sm font-medium">Total Visitors</p>
                 <h2 className="text-3xl font-bold text-white">{visitors.length}</h2>
               </div>
             </Card>
             <Card className="flex items-center gap-4">
               <div className="p-4 bg-indigo-500/20 rounded-full animate-pulse">
                 <Activity className="w-8 h-8 text-indigo-400" />
               </div>
               <div>
                 <p className="text-slate-400 text-sm font-medium">Active Right Now</p>
                 <h2 className="text-3xl font-bold text-white">{activeCount}</h2>
               </div>
             </Card>
           </div>

           {/* Visitor List */}
           <Card>
             <h3 className="text-lg font-semibold text-white mb-4">Visitor Log</h3>
             <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                     <th className="p-4 font-medium">Username</th>
                     <th className="p-4 font-medium">Status</th>
                     <th className="p-4 font-medium text-right">Last Seen</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {visitors.length === 0 ? (
                     <tr>
                       <td colSpan={3} className="p-8 text-center text-slate-500">No visitors recorded yet.</td>
                     </tr>
                   ) : (
                     visitors.map((v, i) => {
                       const online = isActive(v.lastSeen);
                       return (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 text-white font-medium">{v.username}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/50 text-slate-500'}`}>
                              <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                              {online ? 'Active' : 'Offline'}
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-400 text-sm">
                            {new Date(v.lastSeen).toLocaleString()}
                          </td>
                        </tr>
                       );
                     })
                   )}
                 </tbody>
               </table>
             </div>
           </Card>
        </div>
      )}

      {/* --- TICKETS TAB --- */}
      {activeTab === 'tickets' && (
        <div className="grid gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="flex gap-4 mb-2">
            <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
              <span className="text-2xl font-bold text-white block">{tickets.filter(t => t.status === 'pending').length}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Pending</span>
            </div>
          </div>

          {tickets.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-500">No active tickets found.</p>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`border rounded-xl p-6 transition-all ${
                  ticket.status === 'pending' 
                    ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                    : 'bg-slate-900/50 border-slate-800 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ticket.status === 'pending' ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="font-semibold text-white">{ticket.userName}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(ticket.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {ticket.status === 'resolved' && (
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Resolved
                      </span>
                    )}
                    <button onClick={() => handleDeleteTicket(ticket.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 mb-4">
                  <p className="text-slate-200">{ticket.question}</p>
                </div>

                {ticket.status === 'resolved' ? (
                  <div className="pl-4 border-l-2 border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Your Reply:</p>
                    <p className="text-slate-300">{ticket.answer}</p>
                  </div>
                ) : (
                  <div>
                    {activeReplyId === ticket.id ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <textarea
                          value={replyText[ticket.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                          placeholder="Type your answer here..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[100px]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleReply(ticket.id)} disabled={!replyText[ticket.id]?.trim()} className="!py-2 !px-4 text-sm">
                            Send Reply
                          </Button>
                          <Button variant="outline" onClick={() => setActiveReplyId(null)} className="!py-2 !px-4 text-sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => setActiveReplyId(ticket.id)} className="!py-2 !px-4 text-sm">
                        <Reply className="w-4 h-4" /> Reply
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* --- QUESTIONS TAB --- */}
      {activeTab === 'questions' && (
        <div className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-right-4 fade-in duration-300">
          {/* Add Question Form */}
          <Card className="h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Add Custom Question
            </h3>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Question Text</label>
                <textarea 
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  rows={3}
                  placeholder="e.g. Is it safe to share passwords via email?"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-400">Options</label>
                {newQOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...newQOptions];
                      newOpts[idx] = e.target.value;
                      setNewQOptions(newOpts);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                ))}
              </div>
              <Button fullWidth type="submit" disabled={!newQText.trim() || newQOptions.some(o => !o.trim())}>
                Add to Quiz Pool
              </Button>
            </form>
          </Card>

          {/* List Questions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2">Active Custom Questions ({customQuestions.length})</h3>
            {customQuestions.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-8 bg-slate-800/50 rounded-xl border border-slate-700">
                No custom questions yet. The quiz will rely entirely on AI generation.
              </div>
            ) : (
              customQuestions.map(q => (
                <div key={q.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 relative group">
                  <button 
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <p className="font-medium text-white mb-2 pr-8">{q.text}</p>
                  <ul className="space-y-1">
                    {q.options.map((o, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></span>
                        {o.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- SETTINGS TAB --- */}
      {activeTab === 'settings' && (
        <div className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-right-4 fade-in duration-300">
          
          {/* Global Message */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-yellow-400" /> Global Announcement
            </h3>
            <p className="text-xs text-slate-400 mb-3">This message will appear at the top of the screen for all users.</p>
            <div className="space-y-4">
              <textarea
                value={globalMsg}
                onChange={(e) => setGlobalMsg(e.target.value)}
                placeholder="e.g. Maintenance scheduled for tonight..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveGlobalMsg} className="flex-1">Save Message</Button>
                <Button variant="secondary" onClick={() => { setGlobalMsg(''); setGlobalMessage(''); }} className="!px-3">Clear</Button>
              </div>
            </div>
          </Card>

          {/* Block Users */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-400" /> User Management
            </h3>
            
            <form onSubmit={handleBlockUser} className="flex gap-2 mb-6">
              <input 
                type="text"
                value={blockInput}
                onChange={(e) => setBlockInput(e.target.value)}
                placeholder="Enter username to block"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              />
              <Button type="submit" variant="secondary" disabled={!blockInput.trim()}>Block</Button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Blocked Users</h4>
              {blockedUsers.length === 0 ? (
                <p className="text-slate-600 text-sm">No blocked users.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {blockedUsers.map(user => (
                    <div key={user} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-300 text-sm">{user}</span>
                      <button 
                        onClick={() => handleUnblockUser(user)}
                        className="text-slate-500 hover:text-emerald-400 text-xs font-medium"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};