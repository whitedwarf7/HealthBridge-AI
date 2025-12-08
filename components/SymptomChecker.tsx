import React, { useState, useRef, useEffect } from 'react';
import { analyzeSymptoms, findNearbyDoctors, PlaceResult, translateTriage } from '../services/geminiService';
import { TriageResponse, UserProfile } from '../types';

interface SymptomCheckerProps {
  onBack: () => void;
  userProfile?: UserProfile;
}

export const SymptomChecker: React.FC<SymptomCheckerProps> = ({ onBack, userProfile }) => {
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState(5);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Results and Translation State
  const [originalResult, setOriginalResult] = useState<TriageResponse | null>(null);
  const [translatedResult, setTranslatedResult] = useState<TriageResponse | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Computed current result based on toggle
  const result = isTranslated && translatedResult ? translatedResult : originalResult;
  
  // Doctor Search State
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [doctorResults, setDoctorResults] = useState<{ text: string, places: PlaceResult[] } | null>(null);
  
  // Search Filters
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchRadius, setSearchRadius] = useState('5');
  const [searchOpenNow, setSearchOpenNow] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Update specialty filter when result changes
  useEffect(() => {
    if (result?.specialistNeeded) {
      setSearchSpecialty(result.specialistNeeded);
    } else {
      setSearchSpecialty('General Practitioner');
    }
  }, [result]);

  // --- Voice Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' }); // Basic container
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please try typing instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioBlob) return;

      if (!audioPlayerRef.current) {
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audio.onended = () => setIsPlaying(false);
        audioPlayerRef.current = audio;
      }
      
      audioPlayerRef.current.play().catch(e => console.error("Playback failed", e));
      setIsPlaying(true);
    }
  };

  const clearAudio = () => {
     if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
     }
     setIsPlaying(false);
     setAudioBlob(null);
  };

  // --- Image Handling ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFiles(prev => [...prev, file]);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Submission to AI ---
  const handleSubmit = async () => {
    if (!text && !audioBlob && imageFiles.length === 0) {
      alert("Please provide some input (text, voice, or image).");
      return;
    }

    setIsAnalyzing(true);
    setDoctorResults(null); // Reset doctor search on new analysis

    try {
      // Convert Blob to Base64
      let audioBase64: string | null = null;
      if (audioBlob) {
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });
      }

      const response = await analyzeSymptoms(text, imagePreviews, audioBase64, severity, userProfile);
      setOriginalResult(response);
      setTranslatedResult(null);
      setIsTranslated(false);

    } catch (error) {
      console.error(error);
      alert("Something went wrong during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranslate = async () => {
    if (isTranslated) {
      // Revert to original
      setIsTranslated(false);
      return;
    }

    if (translatedResult) {
      // Use cached translation
      setIsTranslated(true);
      return;
    }

    if (!originalResult) return;

    setIsTranslating(true);
    try {
      const translated = await translateTriage(originalResult);
      setTranslatedResult(translated);
      setIsTranslated(true);
    } catch (e) {
      console.error(e);
      alert("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const reset = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlaying(false);
    setText('');
    setSeverity(5);
    setAudioBlob(null);
    setImageFiles([]);
    setImagePreviews([]);
    setOriginalResult(null);
    setTranslatedResult(null);
    setIsTranslated(false);
    setDoctorResults(null);
    setSearchSpecialty('');
    setSearchRadius('5');
    setSearchOpenNow(true);
  };

  const handleFindDoctor = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoadingDoctors(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Use user selected filters
        const searchResult = await findNearbyDoctors(
            latitude, 
            longitude, 
            searchSpecialty,
            searchRadius,
            searchOpenNow
        );
        setDoctorResults(searchResult);
        setIsLoadingDoctors(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location. Please check permissions.");
        setIsLoadingDoctors(false);
      }
    );
  };

  // --- Render Result View ---
  if (result && originalResult) {
    const getSeverityColor = (sev: string) => {
      switch(sev) {
        case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
        case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'EMERGENCY': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    // Check if detected language is not English to show button, or always show for safety.
    const showTranslateButton = originalResult.detectedLanguage && originalResult.detectedLanguage.toLowerCase() !== 'english';

    return (
      <div className="p-4 bg-white min-h-full pb-20">
         <button onClick={reset} className="mb-4 text-teal-600 flex items-center font-medium">
           <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           Check New Symptoms
         </button>
         
         <div className={`p-4 rounded-xl border-2 mb-6 ${getSeverityColor(result.severity)}`}>
            <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-2xl font-bold mb-1">{result.recommendedAction}</h2>
                 <p className="text-sm opacity-90 uppercase tracking-wide font-bold">{result.severity} Priority</p>
               </div>
               
               {result.severity === 'EMERGENCY' && (
                 <a 
                   href={`tel:${result.emergencyNumber || '112'}`}
                   className="bg-red-600 text-white px-4 py-3 rounded-lg font-bold shadow-sm hover:bg-red-700 animate-bounce flex flex-col items-center"
                 >
                   <span className="text-[10px] uppercase">Call Emergency</span>
                   <span className="text-lg leading-none">{result.emergencyNumber || '911/112'}</span>
                 </a>
               )}
            </div>
         </div>

         <div className="space-y-6 relative">
           {/* Detected Language Badge */}
           {originalResult.detectedLanguage && (
             <div className="flex justify-end">
               <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                 Detected: {originalResult.detectedLanguage}
               </span>
             </div>
           )}

           <section>
             <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
             <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{result.summary}</p>
           </section>

           <section>
             <h3 className="font-semibold text-gray-900 mb-2">Advice</h3>
             <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-line">{result.advice}</p>
           </section>

           {/* Translation Link */}
           {showTranslateButton && (
             <div className="flex justify-start">
                <button 
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="text-sm text-teal-600 underline hover:text-teal-800 bg-transparent p-0 border-none cursor-pointer flex items-center"
                >
                  {isTranslating ? 'Translating...' : (isTranslated ? 'Show Original' : 'Translate to English')}
                </button>
             </div>
           )}

           {result.specialistNeeded && (
             <section>
               <h3 className="font-semibold text-gray-900 mb-2">Specialist Suggested</h3>
               <div className="flex items-center text-teal-700 bg-teal-50 p-3 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {result.specialistNeeded}
               </div>
             </section>
           )}

           <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center">
               <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               Find Care Nearby
             </h3>

             {/* Search Filters */}
             <div className="space-y-3 mb-4">
               <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Specialist / Search Term</label>
                  <input 
                    type="text" 
                    value={searchSpecialty}
                    onChange={(e) => setSearchSpecialty(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                    placeholder="e.g. Cardiologist, Pharmacy"
                  />
               </div>
               
               <div className="flex gap-3">
                 <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Distance</label>
                    <select 
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="25">25 km</option>
                      <option value="50">50 km</option>
                    </select>
                 </div>
                 
                 <div className="flex-1 flex flex-col justify-end">
                    <label className="flex items-center space-x-2 cursor-pointer p-2 border border-gray-300 rounded-lg h-[38px] hover:bg-gray-50 bg-white">
                       <input 
                         type="checkbox" 
                         checked={searchOpenNow}
                         onChange={(e) => setSearchOpenNow(e.target.checked)}
                         className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 bg-white border-gray-300"
                       />
                       <span className="text-sm font-medium text-gray-700">Open Now Only</span>
                    </label>
                 </div>
               </div>
             </div>

              {/* Action Button */}
             <button 
                onClick={handleFindDoctor}
                disabled={isLoadingDoctors}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold text-base shadow hover:bg-teal-700 transition flex justify-center items-center"
              >
                {isLoadingDoctors ? (
                  <>
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
           </section>

            {/* Doctor Search Results */}
            {doctorResults && (
              <section className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                   <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                   Results for "{searchSpecialty}"
                </h3>
                
                {/* Fallback Text if parsed places is empty but text exists */}
                {doctorResults.places.length === 0 && (
                   <div className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{doctorResults.text}</div>
                )}
                
                <div className="space-y-3">
                  {doctorResults.places.map((place, idx) => (
                    <a 
                      key={idx} 
                      href={place.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-teal-300 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-gray-800">{place.title}</div>
                        
                        {/* Status Badge */}
                        {place.openStatus && (
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                             place.openStatus.toLowerCase().includes('open') 
                             ? 'bg-green-100 text-green-700' 
                             : 'bg-red-100 text-red-700'
                          }`}>
                            {place.openStatus}
                          </div>
                        )}
                      </div>
                      
                      {/* Distance and Phone */}
                      <div className="mt-2 flex flex-col space-y-1">
                        <div className="flex justify-between items-center">
                           {place.distance && (
                              <div className="flex items-center text-xs text-gray-500">
                                 <svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                 {place.distance}
                              </div>
                           )}
                           
                           {/* Map Link Icon */}
                           <div className="text-teal-600 text-xs font-medium flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              Map
                           </div>
                        </div>

                        {place.phone && (
                           <div className="flex items-center text-xs text-gray-500">
                              <svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {place.phone}
                           </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
         </div>
      </div>
    );
  }

  // --- Render Input View ---
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      <div className="bg-white p-4 shadow-sm z-10">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 text-gray-500">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold">Symptom Checker</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Helper Text */}
        <div className="text-center space-y-2 mt-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto text-teal-600">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">How are you feeling?</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Describe your symptoms. You can speak, type, or upload a photo of the problem.
          </p>
          {userProfile && (
             <p className="text-xs text-teal-600 font-medium">
               Personalized for: {userProfile.name} ({userProfile.age}y, {userProfile.gender})
             </p>
          )}
        </div>

        {/* Inputs */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          
          {/* Voice Input */}
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:bg-gray-50 transition">
             {!isRecording && !audioBlob && (
               <button onClick={startRecording} className="flex flex-col items-center space-y-2 text-gray-600">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                 </div>
                 <span className="font-medium">Tap to Record Voice</span>
               </button>
             )}
             
             {isRecording && (
               <button onClick={stopRecording} className="flex flex-col items-center space-y-2 text-red-600 animate-pulse">
                 <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white">
                   <div className="w-4 h-4 bg-white rounded-sm" />
                 </div>
                 <span className="font-bold">Recording... Tap to Stop</span>
               </button>
             )}

             {audioBlob && (
                <div className="flex items-center space-x-3 w-full bg-green-50 p-2 rounded-lg border border-green-200">
                   <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                   </div>
                   <span className="text-sm font-medium text-green-700 flex-1">Voice Recorded</span>
                   
                   <button onClick={togglePlayback} className="text-green-600 hover:text-green-800 p-1">
                     {isPlaying ? (
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     ) : (
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     )}
                   </button>

                   <button onClick={clearAudio} className="text-gray-400 hover:text-red-500 p-1">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
             )}
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Or type details:</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none bg-white"
              rows={3}
              placeholder="e.g. I have a headache and fever since yesterday..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Image Input */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Add Photo (Optional):</label>
             <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                <label className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400">
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[10px]">Add</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => {
                        setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                        setImageFiles(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg"
                    >
                      &times;
                    </button>
                  </div>
                ))}
             </div>
          </div>
          
          {/* Severity Slider */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
               <span>Overall Severity Level:</span>
               <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">{severity}/10</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={severity} 
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium px-1">
              <span>Mild (1)</span>
              <span>Moderate (5)</span>
              <span>Severe (10)</span>
            </div>
          </div>

        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200 pb-safe">
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing}
          className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition flex items-center justify-center ${
            isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            'Get Advice'
          )}
        </button>
      </div>
    </div>
  );
}