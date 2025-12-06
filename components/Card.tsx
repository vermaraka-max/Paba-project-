import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl ${className}`}>
      {children}
    </div>
  );
};