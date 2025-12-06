import React, { useState, useEffect } from 'react';
import { Mail, X, Send, User, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { createTicket, getTickets } from '../services/storageService';
import { SupportTicket } from '../types';

interface AskAdminProps {
  currentUserName: string;
}

export const AskAdmin: React.FC<AskAdminProps> = ({ currentUserName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [name, setName] = useState(currentUserName);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'ask' | 'history'>('ask');

  useEffect(() => {
    setName(currentUserName);
  }, [currentUserName]);

  const loadTickets = () => {
    const all = getTickets();
    // Filter by name if provided, otherwise show none (or local session ones if we tracked ids, but simple name match for now)
    if (name) {
      const mine = all.filter(t => t.userName.toLowerCase() === name.toLowerCase()).sort((a, b) => b.timestamp - a.timestamp);
      setMyTickets(mine);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTickets();
      const handleUpdate = () => loadTickets();
      window.addEventListener('ticket-update', handleUpdate);
      return () => window.removeEventListener('ticket-update', handleUpdate);
    }
  }, [isOpen, name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !name.trim()) return;
    
    createTicket(name, question);
    setQuestion('');
    setActiveTab('history');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-24 p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 hover:scale-105`}
        title="Ask Admin"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 md:right-24 w-[calc(100vw-3rem)] md:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden h-[500px] max-h-[70vh] animate-in slide-in-from-bottom-4 fade-in">
          {/* Header */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <User className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Ask an Expert</h3>
                <p className="text-xs text-slate-400">Direct Admin Support</p>
              </div>
            </div>
            <div className="flex bg-slate-950 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab('ask')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'ask' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                New
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'history' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                History
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-slate-900/95">
            {activeTab === 'ask' ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Your Question</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="E.g. I clicked a link in a spam email, what should I do?"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-32 resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!question.trim() || !name.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                  Submit Question
                </button>
                <p className="text-xs text-center text-slate-500 mt-2">
                  Admins typically reply within 24 hours.
                </p>
              </form>
            ) : (
              <div className="p-4 space-y-4">
                {myTickets.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No questions found for "{name}"</p>
                  </div>
                ) : (
                  myTickets.map(ticket => (
                    <div key={ticket.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-500">{new Date(ticket.timestamp).toLocaleDateString()}</span>
                        {ticket.status === 'resolved' ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Answered
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium mb-1">Q: {ticket.question}</p>
                      </div>
                      {ticket.answer && (
                        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-3">
                          <p className="text-xs font-bold text-emerald-400 mb-1">Admin Reply:</p>
                          <p className="text-sm text-slate-200">{ticket.answer}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};