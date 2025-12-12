import React from 'react';
import { AppView, AuthUser } from '../types';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
  user?: AuthUser | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onChangeView, user }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 space-y-6 pb-20 min-h-full flex flex-col">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">HealthBridge</h1>
          <p className="text-gray-500 text-sm">Hello, {user?.name.split(' ')[0] || 'Guest'}</p>
        </div>
        <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm overflow-hidden">
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{user ? getInitials(user.name) : 'G'}</span>
          )}
        </div>
      </header>

      {/* Hero / Triage Button Section */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className="relative group">
          {/* Pulse Effect Background */}
          <span className="absolute top-0 left-0 w-full h-full rounded-full bg-teal-400 opacity-20 animate-ping group-hover:animate-none"></span>
          
          <button 
            onClick={() => onChangeView(AppView.SYMPTOM_CHECKER)}
            className="relative w-56 h-56 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_10px_40px_-10px_rgba(45,212,191,0.5)] flex flex-col items-center justify-center text-white transform transition duration-300 hover:scale-105 hover:shadow-[0_20px_50px_-10px_rgba(45,212,191,0.6)] active:scale-95 border-8 border-teal-50"
            aria-label="Start Symptom Triage"
          >
             <div className="bg-white/20 p-4 rounded-full mb-3 backdrop-blur-sm">
               <svg className="w-12 h-12 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
               </svg>
             </div>
             <span className="text-2xl font-bold tracking-tight">Check Symptoms</span>
             <span className="text-teal-100 text-sm mt-1 font-medium">AI-Powered Triage</span>
          </button>
        </div>
        <p className="mt-8 text-gray-500 text-center max-w-[240px] leading-relaxed text-sm">
          Tap the big button above to describe how you feel via voice or text.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Records */}
        <div 
          onClick={() => onChangeView(AppView.RECORDS)}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer flex items-center space-x-4 hover:border-teal-200 transition active:bg-gray-50 group"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Health Records</h3>
            <p className="text-xs text-gray-500">View prescriptions & reports</p>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-teal-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
           <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="ml-3">
                 <h3 className="text-sm font-semibold text-blue-800">Daily Health Tip</h3>
                 <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                   Stay hydrated! Drink at least 8 glasses of water today.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};