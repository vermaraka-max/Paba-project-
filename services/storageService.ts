import { SupportTicket, CustomQuestion, Visitor } from '../types';

const STORAGE_KEYS = {
  TICKETS: 'cybershield_tickets',
  GLOBAL_MSG: 'cybershield_global_message',
  BLOCKED_USERS: 'cybershield_blocked_users',
  CUSTOM_QUESTIONS: 'cybershield_custom_questions',
  VISITORS: 'cybershield_visitors'
};

// --- Tickets ---

export const getTickets = (): SupportTicket[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const createTicket = (userName: string, question: string): SupportTicket => {
  const tickets = getTickets();
  const newTicket: SupportTicket = {
    id: crypto.randomUUID(),
    userName,
    question,
    answer: null,
    timestamp: Date.now(),
    status: 'pending'
  };
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify([...tickets, newTicket]));
  window.dispatchEvent(new Event('storage-update'));
  return newTicket;
};

export const resolveTicket = (ticketId: string, answer: string) => {
  const tickets = getTickets();
  const updated = tickets.map(t => 
    t.id === ticketId ? { ...t, answer, status: 'resolved' as const } : t
  );
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage-update'));
};

export const deleteTicket = (ticketId: string) => {
  const tickets = getTickets();
  const updated = tickets.filter(t => t.id !== ticketId);
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage-update'));
};

// --- Global Message ---

export const getGlobalMessage = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.GLOBAL_MSG);
};

export const setGlobalMessage = (msg: string) => {
  if (!msg.trim()) {
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_MSG);
  } else {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_MSG, msg);
  }
  window.dispatchEvent(new Event('storage-update'));
};

// --- Blocked Users ---

export const getBlockedUsers = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const blockUser = (username: string) => {
  const users = getBlockedUsers();
  const normalized = username.toLowerCase().trim();
  if (!users.includes(normalized)) {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify([...users, normalized]));
    window.dispatchEvent(new Event('storage-update'));
  }
};

export const unblockUser = (username: string) => {
  const users = getBlockedUsers();
  const normalized = username.toLowerCase().trim();
  const updated = users.filter(u => u !== normalized);
  localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage-update'));
};

export const isUserBlocked = (username: string): boolean => {
  const users = getBlockedUsers();
  return users.includes(username.toLowerCase().trim());
};

// --- Custom Questions ---

export const getCustomQuestions = (): CustomQuestion[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_QUESTIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addCustomQuestion = (text: string, options: string[]) => {
  const questions = getCustomQuestions();
  const newQ: CustomQuestion = {
    id: crypto.randomUUID(),
    text,
    options: options.map((opt, idx) => ({ id: `opt-${idx}`, text: opt })),
    createdAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEYS.CUSTOM_QUESTIONS, JSON.stringify([...questions, newQ]));
  window.dispatchEvent(new Event('storage-update'));
};

export const deleteCustomQuestion = (id: string) => {
  const questions = getCustomQuestions();
  const updated = questions.filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_QUESTIONS, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage-update'));
};

// --- Visitors Analytics ---

export const getVisitors = (): Visitor[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VISITORS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const logVisitor = (username: string) => {
  if (!username || username.trim().toLowerCase() === 'admin') return;
  
  const visitors = getVisitors();
  const now = Date.now();
  const normalized = username.trim();
  
  const existingIndex = visitors.findIndex(v => v.username.toLowerCase() === normalized.toLowerCase());
  
  if (existingIndex >= 0) {
    visitors[existingIndex].lastSeen = now;
  } else {
    visitors.push({ username: normalized, lastSeen: now });
  }
  
  localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(visitors));
  window.dispatchEvent(new Event('storage-update'));
};