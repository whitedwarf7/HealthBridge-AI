import React from 'react';
import { Appointment } from '../types';

interface AppointmentsProps {
  appointments: Appointment[];
}

export const Appointments: React.FC<AppointmentsProps> = ({ appointments }) => {
  return (
    <div className="p-4 min-h-full pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Appointments</h1>
      
      <div className="space-y-4">
        {appointments.map(appt => (
          <div key={appt.id} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-teal-500">
             <div className="flex justify-between items-start mb-2">
               <div>
                 <h3 className="font-bold text-gray-900">{appt.doctorName}</h3>
                 <p className="text-sm text-gray-500">{appt.specialty}</p>
               </div>
               <span className={`text-xs font-bold px-2 py-1 rounded ${
                 appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
               }`}>
                 {appt.status}
               </span>
             </div>
             
             <div className="flex items-center text-sm text-gray-600 mt-3 bg-gray-50 p-2 rounded-lg">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {appt.date.toLocaleDateString()} at {appt.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </div>
             
             <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Reschedule
                </button>
                <button className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
                  Connect
                </button>
             </div>
          </div>
        ))}

        <button className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 font-medium hover:bg-gray-50 hover:border-gray-400 hover:text-gray-600 transition flex items-center justify-center">
           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
           Book New Appointment
        </button>
      </div>
    </div>
  );
};
