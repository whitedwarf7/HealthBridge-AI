import React, { useState, useMemo } from 'react';
import { HealthRecord } from '../types';
import { analyzeHealthRecord } from '../services/geminiService';

interface HealthRecordsProps {
  records: HealthRecord[];
  addRecord: (rec: HealthRecord) => void;
  deleteRecord: (id: string) => void;
}

const HealthRecordItem: React.FC<{ record: HealthRecord; onDelete: (id: string) => void }> = ({ record, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determine if it is a PDF based on mimeType
  const isPdf = record.mimeType === 'application/pdf';

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
           {/* File Display Section */}
           {record.imageUrl && (
             <div className="mb-4 w-full rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
               {isPdf ? (
                 <div className="p-6 flex flex-col items-center justify-center text-center">
                   <svg className="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                   <p className="text-sm font-semibold text-gray-800 mb-2">PDF Document</p>
                   <a 
                     href={record.imageUrl} 
                     download={record.title + ".pdf"}
                     className="text-blue-600 text-xs font-bold hover:underline bg-blue-50 px-3 py-2 rounded-full border border-blue-100"
                   >
                     Download / View PDF
                   </a>
                 </div>
               ) : (
                 <img src={record.imageUrl} alt="Record document" className="w-full h-48 object-contain" />
               )}
             </div>
           )}
           
           {/* Summary Section */}
           {record.summary && (
             <div className="bg-blue-50/50 p-3 rounded-lg text-xs text-gray-700 leading-relaxed mb-4 border border-blue-100">
               <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-blue-100">
                 <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <span className="font-bold text-blue-800 uppercase text-[10px] tracking-wider">AI Summary</span>
               </div>
               <p>{record.summary}</p>
             </div>
           )}

           {/* Prescription Medicines Section */}
           {record.type === 'PRESCRIPTION' && record.medicines && record.medicines.length > 0 && (
             <div className="mb-4">
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

           {/* Delete Button */}
           <div className="flex justify-end pt-2 border-t border-gray-100">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onDelete(record.id);
               }}
               className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center px-2 py-1 rounded hover:bg-red-50 transition"
             >
               <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               Delete Record
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export const HealthRecords: React.FC<HealthRecordsProps> = ({ records, addRecord, deleteRecord }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'PRESCRIPTION' | 'LAB_REPORT' | 'OTHER'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

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
          mimeType: file.type, // Store the mime type (e.g., application/pdf)
          medicines: analysis.medicines
        };
        
        addRecord(newRecord);
        setAnalyzing(false);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const processedRecords = useMemo(() => {
    let result = [...records];

    // Filter
    if (filterType !== 'ALL') {
      result = result.filter(r => r.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [records, filterType, sortOrder]);

  return (
    <div className="p-4 min-h-full pb-20 relative">
       {/* Confirmation Modal */}
       {recordToDelete && (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
             <h3 className="font-bold text-lg mb-2 text-gray-800">Delete Record?</h3>
             <p className="text-gray-600 mb-6 text-sm">Are you sure you want to delete <span className="font-semibold text-gray-800">"{records.find(r => r.id === recordToDelete)?.title}"</span>? This action cannot be undone.</p>
             <div className="flex justify-end gap-3">
               <button 
                 onClick={() => setRecordToDelete(null)}
                 className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg text-sm"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => {
                   if (recordToDelete) {
                     deleteRecord(recordToDelete);
                     setRecordToDelete(null);
                   }
                 }}
                 className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 text-sm shadow-sm"
               >
                 Delete
               </button>
             </div>
           </div>
         </div>
       )}

       <header className="mb-4 flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-800">My Records</h1>
         <button 
           onClick={() => setIsUploading(!isUploading)}
           className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition-colors"
         >
           {isUploading ? 'Cancel' : '+ Add New'}
         </button>
       </header>

        {/* Filter and Sort Controls */}
       <div className="mb-6 flex flex-col gap-3">
          {/* Type Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { label: 'All', value: 'ALL' },
              { label: 'Prescriptions', value: 'PRESCRIPTION' },
              { label: 'Lab Reports', value: 'LAB_REPORT' },
              { label: 'Other', value: 'OTHER' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                  filterType === type.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Sort Toggle */}
          <div className="flex justify-end">
            <button 
              onClick={() => setSortOrder(prev => prev === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
              className="flex items-center text-xs text-gray-500 font-medium hover:text-teal-600"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Sort: {sortOrder === 'NEWEST' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
       </div>

       {/* Upload Area */}
       {isUploading && (
         <div className="mb-6 bg-white p-6 rounded-xl border-2 border-dashed border-blue-200 text-center animate-fade-in">
            {analyzing ? (
              <div className="flex flex-col items-center py-4">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                 <p className="text-blue-600 font-medium">Scanning document...</p>
                 <p className="text-xs text-gray-400">Processing images or PDFs</p>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-700">Scan Prescription or Report</h3>
                <p className="text-sm text-gray-400 mt-1">Tap to select photo or PDF</p>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
         </div>
       )}

       {/* List */}
       <div className="space-y-3">
         {processedRecords.length === 0 ? (
           <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
             <p>No records found.</p>
             <p className="text-sm mt-1">Adjust filters or tap "+ Add New" to add one.</p>
           </div>
         ) : (
           processedRecords.map(rec => (
             <HealthRecordItem key={rec.id} record={rec} onDelete={setRecordToDelete} />
           ))
         )}
       </div>
    </div>
  );
};