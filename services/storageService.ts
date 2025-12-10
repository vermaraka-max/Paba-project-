import { SupportTicket, CustomQuestion, Visitor, UserProfile, ScreenTimeLog } from '../types';

const STORAGE_KEYS = {
  TICKETS: 'cybershield_tickets',
  GLOBAL_MSG: 'cybershield_global_message',
  BLOCKED_USERS: 'cybershield_blocked_users',
  CUSTOM_QUESTIONS: 'cybershield_custom_questions',
  VISITORS: 'cybershield_visitors',
  DETOX_USERS: 'cybershield_detox_users',
  DETOX_LOGS: 'cybershield_detox_logs',
  LOCKDOWN_MODE: 'cybershield_lockdown_mode'
};

// --- LOCAL STORAGE HELPERS ---

const isQuotaExceeded = (e: any) => {
  return (
    e instanceof DOMException &&
    (e.code === 22 ||
      e.code === 1014 ||
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (isQuotaExceeded(e)) {
      console.warn("Storage full. Attempting cleanup...");
      if (key === STORAGE_KEYS.DETOX_LOGS) {
         try {
             const logs = JSON.parse(value);
             const cleaned = logs.map((l: any) => { 
               // eslint-disable-next-line @typescript-eslint/no-unused-vars
               const {imageBase64, ...rest} = l; 
               return rest; 
             });
             localStorage.setItem(key, JSON.stringify(cleaned));
             return; 
         } catch (err) { console.error(err); }
      }
      throw e;
    }
    throw e;
  }
};

export const clearDetoxData = () => {
  localStorage.removeItem(STORAGE_KEYS.DETOX_USERS);
  localStorage.removeItem(STORAGE_KEYS.DETOX_LOGS);
  sessionStorage.removeItem('detox_email');
  sessionStorage.removeItem('detox_name');
  window.dispatchEvent(new Event('detox-update'));
};

// --- Lockdown Mode (Head Admin) ---

export const getLockdownStatus = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.LOCKDOWN_MODE) === 'true';
};

export const setLockdownStatus = (isLocked: boolean) => {
  if (isLocked) {
    localStorage.setItem(STORAGE_KEYS.LOCKDOWN_MODE, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.LOCKDOWN_MODE);
  }
  // Trigger update so App.tsx can react
  window.dispatchEvent(new Event('storage-update'));
};

export const nukeDatabase = (target: 'all' | 'users' | 'tickets') => {
  if (target === 'tickets') {
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
  } else if (target === 'users') {
    localStorage.removeItem(STORAGE_KEYS.VISITORS);
    localStorage.removeItem(STORAGE_KEYS.BLOCKED_USERS);
    localStorage.removeItem(STORAGE_KEYS.DETOX_USERS);
    localStorage.removeItem(STORAGE_KEYS.DETOX_LOGS);
  } else if (target === 'all') {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
  window.dispatchEvent(new Event('storage-update'));
  window.dispatchEvent(new Event('detox-update'));
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
  safeSetItem(STORAGE_KEYS.TICKETS, JSON.stringify([...tickets, newTicket]));
  window.dispatchEvent(new Event('storage-update'));
  return newTicket;
};

export const resolveTicket = (ticketId: string, answer: string) => {
  const tickets = getTickets();
  const updated = tickets.map(t => 
    t.id === ticketId ? { ...t, answer, status: 'resolved' as const } : t
  );
  safeSetItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage-update'));
};

export const deleteTicket = (ticketId: string) => {
  const tickets = getTickets();
  const updated = tickets.filter(t => t.id !== ticketId);
  safeSetItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
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
    safeSetItem(STORAGE_KEYS.GLOBAL_MSG, msg);
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
    safeSetItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify([...users, normalized]));
    window.dispatchEvent(new Event('storage-update'));
  }
};

export const unblockUser = (username: string) => {
  const users = getBlockedUsers();
  const normalized = username.toLowerCase().trim();
  const updated = users.filter(u => u !== normalized);
  safeSetItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(updated));
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
  safeSetItem(STORAGE_KEYS.CUSTOM_QUESTIONS, JSON.stringify([...questions, newQ]));
  window.dispatchEvent(new Event('storage-update'));
};

export const deleteCustomQuestion = (id: string) => {
  const questions = getCustomQuestions();
  const updated = questions.filter(q => q.id !== id);
  safeSetItem(STORAGE_KEYS.CUSTOM_QUESTIONS, JSON.stringify(updated));
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
  
  safeSetItem(STORAGE_KEYS.VISITORS, JSON.stringify(visitors));
  window.dispatchEvent(new Event('storage-update'));
};

// --- Digital Detox Logic (Local Only) ---

export const getDetoxUsers = (): UserProfile[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DETOX_USERS);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const getDetoxLogs = (): ScreenTimeLog[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DETOX_LOGS) || '[]');
  } catch { return []; }
};

export const detoxLogin = (email: string, name: string): UserProfile => {
  const users = getDetoxUsers();
  const existing = users.find(u => u.email === email);
  if (existing) {
    if (existing.name !== name) {
      existing.name = name;
      safeSetItem(STORAGE_KEYS.DETOX_USERS, JSON.stringify(users));
    }
    return existing;
  }
  
  const newUser: UserProfile = { email, name, totalPoints: 0, joinedAt: Date.now() };
  const updatedUsers = [...users, newUser];
  safeSetItem(STORAGE_KEYS.DETOX_USERS, JSON.stringify(updatedUsers));
  return newUser;
};

export const uploadScreenTime = (email: string, hours: number, imageBase64?: string) => {
  const logs = getDetoxLogs();
  const today = new Date().toDateString();
  
  const existingLog = logs.find(l => l.email === email && l.dateStr === today);
  if (existingLog) {
    throw new Error("You have already uploaded a screenshot today. Come back tomorrow!");
  }

  let points = 0;
  if (hours < 3) points = 100;
  else if (hours < 6) points = 50;
  else points = 0;

  const newLog: ScreenTimeLog = {
    id: crypto.randomUUID(),
    email,
    dateStr: today,
    hours,
    points,
    timestamp: Date.now(),
    imageBase64: imageBase64
  };

  const newLogs = [...logs, newLog];

  try {
    localStorage.setItem(STORAGE_KEYS.DETOX_LOGS, JSON.stringify(newLogs));
  } catch (e) {
     if (isQuotaExceeded(e)) {
        console.warn("Storage full. Saving log without image.");
        const safeLog = { ...newLog, imageBase64: undefined };
        const cleanedLogs = logs.map(l => { const {imageBase64, ...rest} = l; return rest; });
        localStorage.setItem(STORAGE_KEYS.DETOX_LOGS, JSON.stringify([...cleanedLogs, safeLog]));
     } else { throw e; }
  }
  
  // Update Points
  const users = getDetoxUsers();
  const user = users.find(u => u.email === email);
  if (user) {
    user.totalPoints += points;
    safeSetItem(STORAGE_KEYS.DETOX_USERS, JSON.stringify(users));
  }
  
  window.dispatchEvent(new Event('detox-update'));
  return { points, total: user?.totalPoints || 0 };
};

export const getLeaderboard = (): UserProfile[] => {
  const localUsers = getDetoxUsers();
  return localUsers.sort((a, b) => b.totalPoints - a.totalPoints);
};

export const getMonthlyChampion = (): UserProfile | null => {
  const leaderboard = getLeaderboard();
  return leaderboard.length > 0 ? leaderboard[0] : null; 
};

export const hasUploadedToday = (email: string): boolean => {
  const logs = getDetoxLogs();
  const today = new Date().toDateString();
  return logs.some(l => l.email === email && l.dateStr === today);
};

// --- Admin Detox Functions ---

export const updateUserPoints = (email: string, newPoints: number) => {
  const users = getDetoxUsers();
  const user = users.find(u => u.email === email);
  if (user) {
    user.totalPoints = newPoints;
    safeSetItem(STORAGE_KEYS.DETOX_USERS, JSON.stringify(users));
    window.dispatchEvent(new Event('detox-update'));
  }
};

export const updateLogPoints = (logId: string, newPoints: number) => {
  const logs = getDetoxLogs();
  const log = logs.find(l => l.id === logId);
  
  if (log) {
    const oldPoints = log.points;
    log.points = newPoints;
    
    const users = getDetoxUsers();
    const user = users.find(u => u.email === log.email);
    if (user) {
      user.totalPoints = (user.totalPoints - oldPoints) + newPoints;
      safeSetItem(STORAGE_KEYS.DETOX_USERS, JSON.stringify(users));
    }
    
    safeSetItem(STORAGE_KEYS.DETOX_LOGS, JSON.stringify(logs));
    window.dispatchEvent(new Event('detox-update'));
  }
};

export const deleteDetoxLog = (logId: string) => {
  const logs = getDetoxLogs();
  const logToDelete = logs.find(l => l.id === logId);
  
  if (logToDelete) {
    const updatedLogs = logs.filter(l => l.id !== logId);
    safeSetItem(STORAGE_KEYS.DETOX_LOGS, JSON.stringify(updatedLogs));
    
    const users = getDetoxUsers();
    const user = users.find(u => u.email === logToDelete.email);
    if (user) {
      user.totalPoints = Math.max(0, user.totalPoints - logToDelete.points);
      safeSetItem(STORAGE_KEYS.DETOX_USERS, JSON.stringify(users));
    }
    
    window.dispatchEvent(new Event('detox-update'));
  }
};