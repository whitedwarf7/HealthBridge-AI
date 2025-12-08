import React, { useState } from 'react';
import { HealthRecord } from '../types';
import { analyzeHealthRecord } from '../services/geminiService';

interface HealthRecordsProps {
  records: HealthRecord[];
  addRecord: (rec: HealthRecord) => void;
}

const HealthRecordItem: React.FC<{ record: HealthRecord }> = ({ record }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
      >
        <div className="flex flex-col gap-1">
           <h3 className="font-bold text-gray-800 text-sm leading-tight">{record.title}</h3>
           <div className="flex items-center text-xs text-gray-400">
             <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             {record.date.toLocaleDateString()}
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${
             record.type === 'PRESCRIPTION' ? 'bg-teal-50 text-teal-700 border-teal-100' :
             record.type === 'LAB_REPORT' ? 'bg-blue-50 text-blue-700 border-blue-100' :
             'bg-gray-100 text-gray-600 border-gray-200'
           }`}>
             {record.type.replace('_', ' ')}
           </span>
           <svg 
             className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
             fill="none" 
             stroke="currentColor" 
             viewBox="0 0 24 24"
           >
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-white p-4 animate-fade-in">
           {/* Image Section */}
           {record.imageUrl && (
             <div className="mb-4 w-full h-48 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
               <img src={record.imageUrl} alt="Record document" className="w-full h-full object-contain" />
             </div>
           )}
           
           {/* Summary Section */}
           {record.summary && (
             <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 leading-relaxed mb-4 border border-gray-100">
               <span className="font-bold text-gray-800 block mb-1">AI Summary:</span>
               {record.summary}
             </div>
           )}

           {/* Prescription Medicines Section */}
           {record.type === 'PRESCRIPTION' && record.medicines && record.medicines.length > 0 && (
             <div>
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center">
                 <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                 Medication Details
               </h4>
               <div className="grid gap-3">
                 {record.medicines.map((med, idx) => (
                   <div key={idx} className="bg-teal-50 p-3 rounded-xl border border-teal-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-teal-100 rounded-bl-full opacity-20 -mr-8 -mt-8"></div>
                     
                     <div className="flex justify-between items-start relative z-10">
                       <span className="font-bold text-gray-800 text-sm">{med.name}</span>
                       <span className="text-[10px] bg-white px-2 py-1 rounded text-teal-700 font-bold border border-teal-100 shadow-sm">{med.dosage}</span>
                     </div>
                     
                     <div className="text-gray-600 text-xs mt-2 font-medium flex items-center">
                        <svg className="w-3 h-3 mr-1.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {med.frequency}
                     </div>
                     
                     {med.notes && (
                       <div className="mt-2 pt-2 border-t border-teal-100/50 text-[10px] text-gray-500 italic flex items-start">
                         <svg className="w-3 h-3 mr-1 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         {med.notes}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export const HealthRecords: React.FC<HealthRecordsProps> = ({ records, addRecord }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAnalyzing(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Use AI to extract info
        const analysis = await analyzeHealthRecord(base64);
        
        const newRecord: HealthRecord = {
          id: Date.now().toString(),
          date: new Date(),
          title: analysis.title || "New Record",
          type: analysis.type || "OTHER",
          summary: analysis.summary,
          imageUrl: base64,
          medicines: analysis.medicines
        };
        
        addRecord(newRecord);
        setAnalyzing(false);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 min-h-full pb-20">
       <header className="mb-6 flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-800">My Records</h1>
         <button 
           onClick={() => setIsUploading(!isUploading)}
           className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition-colors"
         >
           {isUploading ? 'Cancel' : '+ Add New'}
         </button>
       </header>

       {/* Upload Area */}
       {isUploading && (
         <div className="mb-6 bg-white p-6 rounded-xl border-2 border-dashed border-blue-200 text-center animate-fade-in">
            {analyzing ? (
              <div className="flex flex-col items-center py-4">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                 <p className="text-blue-600 font-medium">Scanning document...</p>
                 <p className="text-xs text-gray-400">Extracting medicine names & dates</p>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-700">Scan Prescription or Report</h3>
                <p className="text-sm text-gray-400 mt-1">Tap to take a photo or upload</p>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
         </div>
       )}

       {/* List */}
       <div className="space-y-3">
         {records.length === 0 ? (
           <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
             <p>No records yet.</p>
             <p className="text-sm mt-1">Tap "+ Add New" to scan a prescription.</p>
           </div>
         ) : (
           records.map(rec => (
             <HealthRecordItem key={rec.id} record={rec} />
           ))
         )}
       </div>
    </div>
  );
};