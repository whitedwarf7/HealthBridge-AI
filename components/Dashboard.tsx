import React from 'react';
import { AppView, Appointment } from '../types';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
  appointments: Appointment[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onChangeView, appointments }) => {
  const nextAppointment = appointments.find(a => a.status === 'CONFIRMED');

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

      {/* Quick Stats / Info */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => onChangeView(AppView.RECORDS)}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-800">Records</h3>
          <p className="text-xs text-gray-500 mt-1">Prescriptions & Labs</p>
        </div>

        <div 
          onClick={() => onChangeView(AppView.APPOINTMENTS)}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer"
        >
           <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-800">Schedule</h3>
          <p className="text-xs text-gray-500 mt-1">Book a Doctor</p>
        </div>
      </div>

      {/* Next Appointment Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h3>
        {nextAppointment ? (
           <div className="flex items-center gap-4">
             <div className="bg-teal-50 text-teal-700 flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px]">
               <span className="text-xs font-bold uppercase">{nextAppointment.date.toLocaleString('default', { month: 'short' })}</span>
               <span className="text-xl font-bold">{nextAppointment.date.getDate()}</span>
             </div>
             <div>
               <h4 className="font-semibold text-gray-800">{nextAppointment.doctorName}</h4>
               <p className="text-sm text-gray-500">{nextAppointment.specialty}</p>
               <p className="text-xs text-teal-600 font-medium mt-1">
                 {nextAppointment.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </p>
             </div>
           </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">
            No upcoming appointments.
          </div>
        )}
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
