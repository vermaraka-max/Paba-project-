import React, { useState } from 'react';
import { Phone, Siren, Flame, HeartPulse, ShieldAlert, Baby, X, PhoneCall, Radio } from 'lucide-react';

const CONTACTS = [
  { name: "National Emergency", number: "112", icon: Siren, color: "text-red-400" },
  { name: "Police", number: "100", icon: ShieldAlert, color: "text-blue-400" },
  { name: "Cyber Crime Helpline", number: "1930", icon: Radio, color: "text-purple-400" },
  { name: "Ambulance", number: "102", icon: HeartPulse, color: "text-emerald-400" },
  { name: "Fire Brigade", number: "101", icon: Flame, color: "text-orange-400" },
  { name: "Women Helpline", number: "1091", icon: Phone, color: "text-pink-400" },
  { name: "Child Helpline", number: "1098", icon: Baby, color: "text-yellow-400" },
];

export const EmergencyContacts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCall = (e: React.MouseEvent<HTMLAnchorElement>, name: string, number: string) => {
    // Show confirmation dialog before allowing the default action (calling)
    const confirmed = window.confirm(`Are you sure you want to call ${name} (${number})?`);
    if (!confirmed) {
      e.preventDefault();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-24 p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white shadow-red-500/30 hover:scale-105"
        title="Emergency Contacts (India)"
      >
        {isOpen ? <X className="w-6 h-6" /> : <PhoneCall className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-6 md:left-24 w-[calc(100vw-3rem)] md:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
          <div className="bg-red-900/20 p-4 border-b border-red-900/30 flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <Siren className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Emergency (India)</h3>
              <p className="text-xs text-slate-400">Tap to Call</p>
            </div>
          </div>

          <div className="p-2 overflow-y-auto max-h-[60vh]">
            <div className="grid gap-2">
              {CONTACTS.map((contact, idx) => (
                <a
                  key={idx}
                  href={`tel:${contact.number}`}
                  onClick={(e) => handleCall(e, contact.name, contact.number)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-900 ${contact.color}`}>
                      <contact.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{contact.name}</p>
                      <p className="text-xs text-slate-400 font-mono tracking-wider">{contact.number}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 p-2 rounded-full text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Phone className="w-4 h-4" />
                  </div>
                </a>
              ))}
            </div>
            <p className="text-[10px] text-center text-slate-600 mt-3 pb-1">
              Standard call rates may apply.
            </p>
          </div>
        </div>
      )}
    </>
  );
};