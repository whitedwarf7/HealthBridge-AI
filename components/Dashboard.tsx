import React from 'react';
import { AppView } from '../types';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="p-4 space-y-6 pb-20">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">HealthBridge</h1>
          <p className="text-gray-500">Your personal health assistant</p>
        </div>
        <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
          JD
        </div>
      </header>

      {/* Main Action Card */}
      <div 
        onClick={() => onChangeView(AppView.SYMPTOM_CHECKER)}
        className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer transform transition hover:scale-[1.02]"
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2">Feeling Unwell?</h2>
            <p className="text-teal-100 text-sm mb-4">
              Describe your symptoms using voice or text for instant advice.
            </p>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
              Start Triage &rarr;
            </span>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Secondary Actions */}
      <div 
        onClick={() => onChangeView(AppView.RECORDS)}
        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm cursor-pointer flex items-center space-x-4 hover:border-teal-200 transition"
      >
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">My Health Records</h3>
          <p className="text-sm text-gray-500">Manage prescriptions & lab reports</p>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
         <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           Daily Tip
         </h3>
         <p className="text-sm text-blue-700">
           Stay hydrated! In hot weather, drink at least 8 glasses of water a day to prevent dehydration.
         </p>
      </div>

    </div>
  );
};