import React, { useState, useEffect, useRef } from 'react';
import { 
  getTickets, resolveTicket, deleteTicket, 
  getGlobalMessage, setGlobalMessage, 
  getBlockedUsers, blockUser, unblockUser,
  getCustomQuestions, addCustomQuestion, deleteCustomQuestion,
  getVisitors,
  getDetoxUsers, getDetoxLogs, updateUserPoints, updateLogPoints, deleteDetoxLog,
  getLockdownStatus, setLockdownStatus, nukeDatabase
} from '../services/storageService';
import { SupportTicket, CustomQuestion, Visitor, UserProfile, ScreenTimeLog } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { ShieldAlert, LogOut, Check, Trash2, Reply, Settings, MessageSquare, Plus, Users, Megaphone, HelpCircle, Activity, Globe, Eye, X, Smartphone, Edit2, CheckCircle, Lock, Unlock, Zap, Skull, Ban, Terminal } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  startInHdMode?: boolean;
}

type Tab = 'tickets' | 'questions' | 'analytics' | 'settings' | 'detox' | 'hd_console';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, startInHdMode = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  
  // Data States
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [globalMsg, setGlobalMsg] = useState('');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  
  // Detox Data
  const [detoxUsers, setDetoxUsers] = useState<UserProfile[]>([]);
  const [detoxLogs, setDetoxLogs] = useState<ScreenTimeLog[]>([]);

  // System States
  const [isLockdown, setIsLockdown] = useState(false);
  const [isHeadAdmin, setIsHeadAdmin] = useState(startInHdMode);

  // Form States
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '']);
  
  const [blockInput, setBlockInput] = useState('');
  
  // Edit Points State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPointsVal, setEditPointsVal] = useState<string>('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const loadData = () => {
    const allTickets = getTickets();
    setTickets(allTickets.sort((a, b) => {
      if (a.status === b.status) return b.timestamp - a.timestamp;
      return a.status === 'pending' ? -1 : 1;
    }));
    setCustomQuestions(getCustomQuestions());
    setBlockedUsers(getBlockedUsers());
    setGlobalMsg(getGlobalMessage() || '');
    setVisitors(getVisitors().sort((a, b) => b.lastSeen - a.lastSeen));
    setDetoxUsers(getDetoxUsers().sort((a, b) => b.totalPoints - a.totalPoints));
    setDetoxLogs(getDetoxLogs().sort((a, b) => b.timestamp - a.timestamp));
    setIsLockdown(getLockdownStatus());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); 
    window.addEventListener('storage-update', loadData);
    window.addEventListener('detox-update', loadData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage-update', loadData);
      window.removeEventListener('detox-update', loadData);
    };
  }, []);

  // --- Handlers ---
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

  const handleQuickBlock = (name: string) => {
    if(confirm(`Are you sure you want to block ${name}?`)) {
      blockUser(name);
    }
  };

  const handleUnblockUser = (user: string) => {
    unblockUser(user);
  };
  
  const handleEditPoints = (user: UserProfile) => {
    setEditingUserId(user.email);
    setEditPointsVal(user.totalPoints.toString());
  };
  
  const handleSavePoints = () => {
    if (editingUserId && editPointsVal !== '') {
      updateUserPoints(editingUserId, parseInt(editPointsVal) || 0);
      setEditingUserId(null);
    }
  };

  const handleVerifyLog = (logId: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      if(confirm("Are you sure you want to invalidate this log? This will set points to 0 for this entry.")) {
        updateLogPoints(logId, 0);
      }
    } else {
      const newPts = prompt("Enter verified points:", "100");
      if (newPts !== null) {
        updateLogPoints(logId, parseInt(newPts) || 0);
      }
    }
  };

  // HD ACTIONS
  const toggleLockdown = () => {
    const newState = !isLockdown;
    setLockdownStatus(newState);
    setIsLockdown(newState);
  };

  const handleNuke = (type: 'all' | 'users' | 'tickets') => {
    const confirmText = type === 'all' ? "DESTROY EVERYTHING?" : `Delete all ${type}?`;
    if(confirm(`${confirmText} This cannot be undone.`)) {
        if(type === 'all' && !confirm("DOUBLE CHECK: Are you absolutely sure?")) return;
        nukeDatabase(type);
        loadData();
    }
  };

  // Helpers
  const isActive = (timestamp: number) => {
    return Date.now() - timestamp < 5 * 60 * 1000;
  };
  const activeCount = visitors.filter(v => isActive(v.lastSeen)).length;

  const getThemeClass = () => {
    return isHeadAdmin ? "font-mono bg-black text-green-500" : "";
  };

  return (
    <div className={`w-full min-h-screen ${isHeadAdmin ? 'bg-black text-green-500' : 'bg-transparent'} transition-colors duration-500`}>
    <div className="w-full max-w-6xl mx-auto p-4 pb-20 relative">
      
      {/* Image Preview Modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-8 cursor-pointer" onClick={() => setViewingImage(null)}>
          <div className="max-w-4xl max-h-full relative">
             <img src={`data:image/jpeg;base64,${viewingImage}`} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-slate-700" alt="Audit Evidence" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b ${isHeadAdmin ? 'border-green-800 pb-4' : 'border-transparent'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${isHeadAdmin ? 'bg-green-900/20 border-green-500 text-green-500' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
            {isHeadAdmin ? <Terminal className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
                {isHeadAdmin ? 'SYSTEM OVERRIDE: ENGAGED' : 'Admin Dashboard'}
            </h1>
            <p className={isHeadAdmin ? 'text-green-700' : 'text-slate-400'}>
                {isHeadAdmin ? 'Root Access Granted. Protocol: OMEGA' : 'Manage questions, users, and alerts'}
            </p>
          </div>
        </div>
        
        {isLockdown && (
            <div className="animate-pulse bg-red-600 px-6 py-2 rounded font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4" /> LOCKDOWN ACTIVE
            </div>
        )}

        <Button variant="secondary" onClick={onLogout} className={isHeadAdmin ? "!bg-green-900/20 !border-green-600 !text-green-500 hover:!bg-green-900/40" : ""}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>

      {/* Navigation */}
      <div className={`flex gap-2 mb-6 border-b pb-1 overflow-x-auto ${isHeadAdmin ? 'border-green-800' : 'border-slate-700'}`}>
        {[
            { id: 'analytics', icon: Activity, label: 'Analytics' },
            { id: 'tickets', icon: MessageSquare, label: 'Tickets' },
            { id: 'detox', icon: Smartphone, label: 'Detox' },
            { id: 'questions', icon: HelpCircle, label: 'Questions' },
            { id: 'settings', icon: Settings, label: 'Settings' },
            ...(isHeadAdmin ? [{ id: 'hd_console', icon: Zap, label: 'OVERRIDE' }] : [])
        ].map((tab) => (
             <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as Tab)}
             className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${
                activeTab === tab.id 
                 ? isHeadAdmin 
                    ? 'bg-green-900/20 text-green-400 border-b-2 border-green-500' 
                    : 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' 
                 : isHeadAdmin
                    ? 'text-green-800 hover:text-green-500 hover:bg-green-900/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
             }`}
           >
             <tab.icon className="w-4 h-4" /> {tab.label}
           </button>
        ))}
      </div>

      {/* --- HD CONSOLE (GOD MODE) --- */}
      {activeTab === 'hd_console' && isHeadAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in duration-300">
             <div className="bg-black border border-green-500/50 p-6 rounded shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-green-800 pb-2">
                    <Lock className="w-5 h-5" /> EMERGENCY PROTOCOLS
                 </h2>
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-green-800 rounded bg-green-900/10">
                        <div>
                            <h3 className="font-bold">SYSTEM LOCKDOWN</h3>
                            <p className="text-xs text-green-700">Prevents ANY new users from starting quizzes.</p>
                        </div>
                        <button 
                            onClick={toggleLockdown}
                            className={`px-4 py-2 font-bold rounded ${isLockdown ? 'bg-red-600 text-white animate-pulse' : 'bg-green-900/30 text-green-500 border border-green-600 hover:bg-green-500 hover:text-black'}`}
                        >
                            {isLockdown ? 'DISENGAGE' : 'ENGAGE'}
                        </button>
                    </div>
                 </div>
             </div>

             <div className="bg-black border border-red-500/50 p-6 rounded shadow-[0_0_20px_rgba(255,0,0,0.1)]">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-red-800 pb-2 text-red-500">
                    <Skull className="w-5 h-5" /> DANGER ZONE
                 </h2>
                 <div className="space-y-4">
                    <button onClick={() => handleNuke('tickets')} className="w-full p-3 border border-red-900 text-red-700 hover:bg-red-900/20 hover:text-red-500 text-left transition-colors flex justify-between">
                        <span>PURGE TICKET DATABASE</span>
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleNuke('users')} className="w-full p-3 border border-red-900 text-red-700 hover:bg-red-900/20 hover:text-red-500 text-left transition-colors flex justify-between">
                        <span>PURGE USER DATA (Detox/Logs)</span>
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleNuke('all')} className="w-full p-4 bg-red-900/20 border border-red-500 text-red-500 font-bold hover:bg-red-500 hover:text-black text-center tracking-widest transition-all">
                        INITIATE FACTORY RESET (NUKE)
                    </button>
                 </div>
             </div>
          </div>
      )}

      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'analytics' && (
        <div className="grid gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className={`flex items-center gap-4 ${isHeadAdmin ? 'bg-black border-green-500/30' : ''}`}>
               <div className={`p-4 rounded-full ${isHeadAdmin ? 'bg-green-900/20 text-green-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                 <Globe className="w-8 h-8" />
               </div>
               <div>
                 <p className={isHeadAdmin ? 'text-green-700' : 'text-slate-400 text-sm font-medium'}>Total Visitors</p>
                 <h2 className="text-3xl font-bold">{visitors.length}</h2>
               </div>
             </Card>
             <Card className={`flex items-center gap-4 ${isHeadAdmin ? 'bg-black border-green-500/30' : ''}`}>
               <div className={`p-4 rounded-full animate-pulse ${isHeadAdmin ? 'bg-green-900/20 text-green-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                 <Activity className="w-8 h-8" />
               </div>
               <div>
                 <p className={isHeadAdmin ? 'text-green-700' : 'text-slate-400 text-sm font-medium'}>Active Right Now</p>
                 <h2 className="text-3xl font-bold">{activeCount}</h2>
               </div>
             </Card>
           </div>
           
           <Card className={isHeadAdmin ? 'bg-black border-green-500/30' : ''}>
             <h3 className="font-semibold mb-4">Visitor Log (Last 50)</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className={`border-b ${isHeadAdmin ? 'border-green-800 text-green-600' : 'border-slate-700 text-slate-400'}`}>
                     <th className="p-2">Name</th>
                     <th className="p-2">Last Seen</th>
                     <th className="p-2">Status</th>
                     <th className="p-2">Action</th>
                   </tr>
                 </thead>
                 <tbody className={isHeadAdmin ? 'text-green-400' : 'text-slate-300'}>
                   {visitors.slice(0, 50).map(v => {
                      const blocked = blockedUsers.includes(v.username.toLowerCase());
                      return (
                        <tr key={v.username} className={`border-b ${isHeadAdmin ? 'border-green-900 hover:bg-green-900/10' : 'border-slate-800 hover:bg-slate-800/50'}`}>
                          <td className="p-2 font-mono">{v.username}</td>
                          <td className="p-2 text-sm">{new Date(v.lastSeen).toLocaleTimeString()}</td>
                          <td className="p-2">
                             {isActive(v.lastSeen) ? <span className="text-emerald-500 font-bold text-xs">ONLINE</span> : <span className="opacity-50 text-xs">OFFLINE</span>}
                          </td>
                          <td className="p-2">
                             {blocked ? (
                               <button onClick={() => handleUnblockUser(v.username)} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-colors">
                                 UNBLOCK
                               </button>
                             ) : (
                               <button onClick={() => handleQuickBlock(v.username)} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1">
                                 <Ban className="w-3 h-3" /> BLOCK
                               </button>
                             )}
                          </td>
                        </tr>
                      );
                   })}
                 </tbody>
               </table>
             </div>
           </Card>
        </div>
      )}
      
      {/* --- DETOX TAB --- */}
      {activeTab === 'detox' && (
        <div className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-right-4 fade-in duration-300">
          <Card className={`h-fit ${isHeadAdmin ? 'bg-black border-green-500/30' : ''}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> User Management
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {detoxUsers.length === 0 ? (
                 <p className="opacity-50 text-center py-4">No participants yet.</p>
               ) : (
                 detoxUsers.map(user => {
                   const blocked = blockedUsers.includes(user.name.toLowerCase());
                   return (
                   <div key={user.email} className={`border rounded-lg p-3 flex items-center justify-between ${isHeadAdmin ? 'border-green-800 bg-green-900/10' : 'bg-slate-800/50 border-slate-700'}`}>
                     <div>
                       <p className="font-medium">{user.name}</p>
                       <p className="text-xs opacity-50">{user.email}</p>
                       {blocked && <span className="text-xs text-red-500 font-bold">BLOCKED</span>}
                     </div>
                     <div className="flex items-center gap-3">
                       {/* Block Button */}
                       {blocked ? (
                          <button onClick={() => handleUnblockUser(user.name)} className="p-1 text-emerald-500 hover:bg-emerald-500/20 rounded">
                              <Unlock className="w-4 h-4" />
                          </button>
                       ) : (
                          <button onClick={() => handleQuickBlock(user.name)} className="p-1 text-red-500 hover:bg-red-500/20 rounded" title="Block User">
                              <Ban className="w-4 h-4" />
                          </button>
                       )}

                       {editingUserId === user.email ? (
                         <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             value={editPointsVal}
                             onChange={(e) => setEditPointsVal(e.target.value)}
                             className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                             autoFocus
                           />
                           <button onClick={handleSavePoints} className="text-emerald-400 hover:text-emerald-300">
                             <Check className="w-4 h-4" />
                           </button>
                           <button onClick={() => setEditingUserId(null)} className="text-red-400 hover:text-red-300">
                             <X className="w-4 h-4" />
                           </button>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2">
                            <span className="font-bold opacity-80">{user.totalPoints} pts</span>
                            <button onClick={() => handleEditPoints(user)} className="opacity-50 hover:opacity-100" title="Edit Points">
                              <Edit2 className="w-3 h-3" />
                            </button>
                         </div>
                       )}
                     </div>
                   </div>
                 )})
               )}
            </div>
          </Card>
          <Card className={isHeadAdmin ? 'bg-black border-green-500/30' : ''}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" /> Screen Time Audit
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {detoxLogs.length === 0 ? (
                <p className="opacity-50 text-center py-8">No logs submitted yet.</p>
              ) : (
                detoxLogs.map(log => (
                  <div key={log.id} className={`border rounded-xl p-4 ${isHeadAdmin ? 'border-green-800 bg-green-900/10' : 'bg-slate-800/80 border-slate-700'}`}>
                     <div className="flex justify-between items-start mb-2">
                       <div>
                         <p className="text-sm font-semibold">{log.email}</p>
                         <p className="text-xs opacity-50">{log.dateStr}</p>
                       </div>
                       <div className="text-right">
                         <p className={`text-sm font-bold ${log.points > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                           {log.points} pts
                         </p>
                       </div>
                     </div>
                     <div className="flex gap-2 mt-3">
                       {log.imageBase64 && (
                         <button 
                          onClick={() => setViewingImage(log.imageBase64!)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-white transition-colors"
                         >
                           <Eye className="w-3 h-3" /> View Evidence
                         </button>
                       )}
                       <div className="ml-auto flex gap-1">
                          <button 
                            onClick={() => handleVerifyLog(log.id, 'approve')}
                            className="p-1.5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-md transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { if(confirm('Delete this log permanently?')) deleteDetoxLog(log.id); }}
                            className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                     </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* --- TICKETS TAB --- */}
      {activeTab === 'tickets' && (
        <div className="grid gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="flex gap-4 mb-2">
            <div className={`rounded-lg px-4 py-2 border ${isHeadAdmin ? 'bg-green-900/20 border-green-500 text-green-500' : 'bg-slate-800 border-slate-700'}`}>
              <span className="text-2xl font-bold block">{tickets.filter(t => t.status === 'pending').length}</span>
              <span className="text-xs uppercase tracking-wider opacity-70">Pending</span>
            </div>
          </div>
          {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`border rounded-xl p-6 transition-all ${
                    isHeadAdmin 
                    ? 'border-green-800 bg-black text-green-400' 
                    : ticket.status === 'pending' 
                        ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                        : 'bg-slate-900/50 border-slate-800 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ticket.status === 'pending' ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="font-semibold">{ticket.userName}</span>
                     {/* Block Ticket User */}
                     <button onClick={() => handleQuickBlock(ticket.userName)} className="text-xs text-red-500 hover:text-red-300 underline ml-2">Block User</button>
                  </div>
                  <button onClick={() => handleDeleteTicket(ticket.id)} className="opacity-50 hover:opacity-100 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className={`p-4 rounded-lg border mb-4 ${isHeadAdmin ? 'bg-green-900/10 border-green-900' : 'bg-slate-950/50 border-slate-800'}`}>
                  <p>{ticket.question}</p>
                </div>
                {ticket.status === 'pending' ? (
                  activeReplyId === ticket.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={replyText[ticket.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                          className={`w-full border rounded-lg p-3 focus:outline-none ${isHeadAdmin ? 'bg-black border-green-500 text-green-500' : 'bg-slate-900 border-slate-700 text-white'}`}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleReply(ticket.id)} disabled={!replyText[ticket.id]?.trim()} className="!py-2 !px-4 text-sm">Send</Button>
                          <Button variant="outline" onClick={() => setActiveReplyId(null)} className="!py-2 !px-4 text-sm">Cancel</Button>
                        </div>
                      </div>
                  ) : (
                    <Button variant="outline" onClick={() => setActiveReplyId(ticket.id)} className="!py-2 !px-4 text-sm"><Reply className="w-4 h-4" /> Reply</Button>
                  )
                ) : (
                  <div className="pl-4 border-l-2 border-slate-700">
                    <p className="text-xs font-semibold opacity-50 mb-1">Reply:</p>
                    <p className="opacity-80">{ticket.answer}</p>
                  </div>
                )}
              </div>
          ))}
        </div>
      )}

      {/* --- SETTINGS TAB --- */}
      {activeTab === 'settings' && (
        <div className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-right-4 fade-in duration-300">
          {/* Global Message */}
          <Card className={isHeadAdmin ? 'bg-black border-green-500/30' : ''}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-yellow-400" /> Global Announcement
            </h3>
            <div className="space-y-4">
              <textarea
                value={globalMsg}
                onChange={(e) => setGlobalMsg(e.target.value)}
                placeholder="e.g. Maintenance scheduled..."
                className={`w-full border rounded-lg p-3 text-sm focus:outline-none ${isHeadAdmin ? 'bg-black border-green-500 text-green-500' : 'bg-slate-900 border-slate-700 text-white'}`}
                rows={3}
              />
              <Button onClick={handleSaveGlobalMsg} className="w-full">Save Message</Button>
            </div>
          </Card>
          
          <Card className={isHeadAdmin ? 'bg-black border-green-500/30' : ''}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                 <Ban className="w-5 h-5 text-red-400" /> Manual Block
              </h3>
              <form onSubmit={handleBlockUser} className="space-y-4">
                  <input 
                     value={blockInput}
                     onChange={(e) => setBlockInput(e.target.value)}
                     placeholder="Enter exact username"
                     className={`w-full border rounded-lg p-3 text-sm focus:outline-none ${isHeadAdmin ? 'bg-black border-green-500 text-green-500' : 'bg-slate-900 border-slate-700 text-white'}`}
                  />
                  <Button fullWidth variant="secondary" type="submit">Block User</Button>
              </form>
          </Card>
        </div>
      )}
      
      {/* Questions Tab Omitted for Brevity (Same as before) */}
       {activeTab === 'questions' && (
        <div className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-right-4 fade-in duration-300">
          <Card className={`h-fit ${isHeadAdmin ? 'bg-black border-green-500/30' : ''}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Add Custom Question</h3>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <textarea value={newQText} onChange={(e) => setNewQText(e.target.value)} className={`w-full border rounded-lg p-3 text-sm focus:outline-none ${isHeadAdmin ? 'bg-black border-green-500 text-green-500' : 'bg-slate-900 border-slate-700 text-white'}`} rows={3} required />
              <div className="space-y-2">
                {newQOptions.map((opt, idx) => (
                  <input key={idx} type="text" value={opt} onChange={(e) => { const newOpts = [...newQOptions]; newOpts[idx] = e.target.value; setNewQOptions(newOpts); }} className={`w-full border rounded-lg px-3 py-2 text-sm ${isHeadAdmin ? 'bg-black border-green-500 text-green-500' : 'bg-slate-900 border-slate-700 text-white'}`} required />
                ))}
              </div>
              <Button fullWidth type="submit">Add to Quiz Pool</Button>
            </form>
          </Card>
          <div className="space-y-4">
            {customQuestions.map(q => (
                <div key={q.id} className={`border rounded-xl p-4 relative group ${isHeadAdmin ? 'border-green-800 bg-green-900/10' : 'bg-slate-800/80 border-slate-700'}`}>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-2 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  <p className="font-medium mb-2 pr-8">{q.text}</p>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};