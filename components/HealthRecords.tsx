import React, { useState } from 'react';
import { HealthRecord } from '../types';
import { analyzeHealthRecord } from '../services/geminiService';

interface HealthRecordsProps {
  records: HealthRecord[];
  addRecord: (rec: HealthRecord) => void;
}

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
          title: analysis.title,
          type: analysis.type,
          summary: analysis.summary,
          imageUrl: base64
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
           className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-blue-700"
         >
           + Add New
         </button>
       </header>

       {/* Upload Area */}
       {(isUploading || analyzing) && (
         <div className="mb-6 bg-white p-6 rounded-xl border-2 border-dashed border-blue-200 text-center">
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
                <p className="text-sm text-gray-400 mt-1">Tap to take a photo</p>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
         </div>
       )}

       {/* List */}
       <div className="space-y-4">
         {records.length === 0 ? (
           <div className="text-center py-10 text-gray-400">
             <p>No records yet. Tap "+ Add New" to scan a prescription.</p>
           </div>
         ) : (
           records.map(rec => (
             <div key={rec.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
               {rec.imageUrl && (
                 <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                   <img src={rec.imageUrl} alt="doc" className="w-full h-full object-cover" />
                 </div>
               )}
               <div className="flex-1">
                 <div className="flex justify-between items-start">
                   <h3 className="font-bold text-gray-800 text-sm">{rec.title}</h3>
                   <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{rec.type}</span>
                 </div>
                 <p className="text-xs text-gray-500 mt-0.5">{rec.date.toLocaleDateString()}</p>
                 <p className="text-xs text-gray-600 mt-2 leading-relaxed bg-gray-50 p-2 rounded">
                   {rec.summary || "No details extracted."}
                 </p>
               </div>
             </div>
           ))
         )}
       </div>
    </div>
  );
};
