import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TriageResponse, HealthRecord, UserProfile } from '../types';

// Constants
const TRIAGE_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export const analyzeSymptoms = async (
  textInput: string, 
  imageParts: string[] = [], 
  audioPart: string | null = null,
  severityLevel: number = 0,
  userProfile?: UserProfile
): Promise<TriageResponse> => {
  // Initialize AI client per request to ensure latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];

  // Build Context String
  let contextParts = [];
  
  if (userProfile) {
    contextParts.push(`PATIENT PROFILE:\n- Name: ${userProfile.name}\n- Age: ${userProfile.age}\n- Gender: ${userProfile.gender}\n- Pre-existing Conditions: ${userProfile.preExistingConditions}\n- Allergies: ${userProfile.allergies}`);
  }

  if (severityLevel > 0) {
    contextParts.push(`USER REPORTED SEVERITY: ${severityLevel}/10`);
  }

  contextParts.push(`SYMPTOMS DESCRIPTION: ${textInput}`);

  const combinedText = contextParts.join('\n\n');
  parts.push({ text: combinedText });

  // Add images (base64)
  imageParts.forEach(img => {
    // Strip header if present e.g. "data:image/jpeg;base64,"
    const base64Data = img.split(',')[1] || img;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    });
  });

  // Add audio (base64)
  if (audioPart) {
    const base64Data = audioPart.split(',')[1] || audioPart;
    parts.push({
      inlineData: {
        mimeType: 'audio/mp3', // Adjust based on recording format
        data: base64Data
      }
    });
  }

  // Schema for structured output
  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "A concise summary of the reported symptoms in simple language." },
      severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], description: "The severity level of the symptoms." },
      advice: { type: Type.STRING, description: "Immediate self-care advice or next steps. Keep it simple and actionable." },
      recommendedAction: { type: Type.STRING, description: "One of: 'Home Care', 'Visit Pharmacy', 'See Doctor', 'Go to Hospital'." },
      specialistNeeded: { type: Type.STRING, description: "If a doctor is needed, what kind? e.g. 'General Practitioner', 'Dermatologist'." },
      emergencyNumber: { type: Type.STRING, description: "The local emergency phone number (e.g. 911, 112, 999) if severity is EMERGENCY. Default to '112' if unknown." },
      detectedLanguage: { type: Type.STRING, description: "The language detected from the user input (e.g., 'Spanish', 'Hindi', 'English')." }
    },
    required: ["summary", "severity", "advice", "recommendedAction"],
  };

  try {
    const response = await ai.models.generateContent({
      model: TRIAGE_MODEL,
      contents: { parts },
      config: {
        systemInstruction: `You are HealthBridge, a compassionate medical triage assistant for patients in underserved regions. 
        Analyze the provided symptoms (text, voice audio, or images of physical conditions).
        
        CRITICAL INSTRUCTION:
        1. Detect the language used in the user's input (audio or text).
        2. Provide the 'summary', 'advice', 'recommendedAction', and 'specialistNeeded' fields IN THAT SAME DETECTED LANGUAGE.
        3. Fill the 'detectedLanguage' field with the name of the language used.

        - Use simple, easy-to-understand language (Grade 6 reading level).
        - Consider the PATIENT PROFILE (Age, Gender, Conditions) heavily. For example, chest pain in an older person with heart history is higher risk than a teenager.
        - Take the user's self-reported severity level (1-10) into serious consideration.
        - If the user provides a picture of a medication, explain what it is used for.
        - If the symptoms seem life-threatening (chest pain, severe bleeding, difficulty breathing), flag as EMERGENCY immediately.
        - If severity is EMERGENCY, provide the likely local emergency contact number.
        - Be culturally sensitive and supportive.
        - PRELIMINARY ADVICE ONLY. NOT A DIAGNOSIS.`,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    return JSON.parse(resultText) as TriageResponse;

  } catch (error) {
    console.error("Gemini Triage Error:", error);
    return {
      summary: "Could not analyze symptoms due to connection error.",
      severity: "MEDIUM",
      advice: "Please consult a local health worker directly.",
      recommendedAction: "See Doctor",
      detectedLanguage: "English"
    };
  }
};

export const translateTriage = async (original: TriageResponse): Promise<TriageResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Optimization: Only translate specific text fields to reduce token usage and latency.
    const contentToTranslate = {
      summary: original.summary,
      advice: original.advice,
      recommendedAction: original.recommendedAction,
      specialistNeeded: original.specialistNeeded || "General Practitioner" // Default to ensure schema validity
    };

    const prompt = `Translate the values of this JSON object to English. 
    Source:
    ${JSON.stringify(contentToTranslate)}`;

    const response = await ai.models.generateContent({
      model: TRIAGE_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             summary: { type: Type.STRING },
             advice: { type: Type.STRING },
             recommendedAction: { type: Type.STRING },
             specialistNeeded: { type: Type.STRING },
          }
        }
      }
    });
    
    const translated = JSON.parse(response.text || "{}");
    
    return {
      ...original,
      summary: translated.summary || original.summary,
      advice: translated.advice || original.advice,
      recommendedAction: translated.recommendedAction || original.recommendedAction,
      specialistNeeded: original.specialistNeeded ? translated.specialistNeeded : undefined, // Keep logic consistent
      detectedLanguage: "English"
    };
  } catch (error) {
    console.error("Translation Error", error);
    throw error;
  }
};

export const generateTts = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) throw new Error("No audio generated");
    return base64Data;
  } catch (error) {
    console.error("TTS Service Error:", error);
    throw error;
  }
};

export const analyzeHealthRecord = async (fileDataUrl: string): Promise<Partial<HealthRecord>> => {
   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
   
   // Extract mime type and base64 data using regex to handle both images and PDFs properly
   // Expected format: data:<mimeType>;base64,<data>
   const matches = fileDataUrl.match(/^data:(.+);base64,(.+)$/);
   
   let mimeType = 'image/jpeg'; // Default fallback
   let base64Data = fileDataUrl;

   if (matches && matches.length === 3) {
       mimeType = matches[1];
       base64Data = matches[2];
   } else {
       // Fallback for raw base64 or legacy inputs
       base64Data = fileDataUrl.split(',')[1] || fileDataUrl;
   }
   
   try {
    const response = await ai.models.generateContent({
      model: TRIAGE_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: "Analyze this medical document (image or PDF). Identify if it is a prescription, lab report, or other. Extract the title (e.g., 'Amoxicillin Prescription' or 'Blood Test Results') and a 1-sentence summary of key details. If it is a PRESCRIPTION, extract the list of medicines including name, dosage, frequency, and specific notes." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['PRESCRIPTION', 'LAB_REPORT', 'OTHER'] },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  notes: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
   } catch (e) {
     console.error(e);
     return { title: "Unknown Document", summary: "Analysis failed", type: "OTHER" };
   }
};

export interface PlaceResult {
  title: string;
  uri: string;
  distance?: string;
  phone?: string;
  address?: string;
  openStatus?: string;
}

export const findNearbyDoctors = async (
  lat: number, 
  lng: number, 
  specialist?: string, 
  radiusKm?: string,
  openNow?: boolean
): Promise<{ text: string, places: PlaceResult[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const specialistTerm = specialist || 'general practitioner doctors';
    const radiusText = radiusKm ? `within ${radiusKm} kilometers` : '';
    const openNowText = openNow ? 'Only include locations that are currently OPEN.' : '';

    const query = `Find ${specialistTerm} and clinics near me ${radiusText}. ${openNowText} Sort them by distance. 
    Provide the result as a list. For each location, strictly follow this format:
    "Name: <name> // Distance: <distance> // Phone: <phone number> // Status: <Open Now/Closed/Hours>"
    Example: "City Clinic // 0.5 miles // 555-1234 // Open Now"`;
    
    const response = await ai.models.generateContent({
      model: TRIAGE_MODEL,
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    const text = response.text || "Here are some locations nearby.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const rawPlaces: PlaceResult[] = chunks
      .map((chunk: any) => {
        if (chunk.maps) {
           return {
             title: chunk.maps.title,
             uri: chunk.maps.googleMapsUri || chunk.maps.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chunk.maps.title)}&query_place_id=${chunk.maps.placeId}`
           };
        } else if (chunk.web) {
           return {
             title: chunk.web.title,
             uri: chunk.web.uri
           };
        }
        return null;
      })
      .filter((p: any) => p !== null);

    const lines = text.split('\n');
    const parsedDetails: { name: string, distance: string, phone: string, status: string }[] = [];
    
    lines.forEach(line => {
       const parts = line.split('//').map(s => s.trim());
       if (parts.length >= 2) {
         const namePart = parts[0].replace(/Name:|^\d+\./gi, '').trim();
         const distPart = parts.find(p => p.toLowerCase().includes('distance:'))?.replace(/distance:/i, '').trim() || parts[1];
         const phonePart = parts.find(p => p.toLowerCase().includes('phone:'))?.replace(/phone:/i, '').trim() || parts[2] || '';
         const statusPart = parts.find(p => p.toLowerCase().includes('status:'))?.replace(/status:/i, '').trim() || parts[3] || '';
         
         parsedDetails.push({
           name: namePart,
           distance: distPart,
           phone: phonePart,
           status: statusPart
         });
       }
    });

    const mergedPlaces = parsedDetails.map(detail => {
       const match = rawPlaces.find(p => p.title.toLowerCase().includes(detail.name.toLowerCase()) || detail.name.toLowerCase().includes(p.title.toLowerCase()));
       
       return {
         title: detail.name,
         uri: match ? match.uri : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.name)}`,
         distance: detail.distance,
         phone: detail.phone,
         openStatus: detail.status
       };
    });

    const finalPlaces = mergedPlaces.length > 0 ? mergedPlaces : rawPlaces;

    return { text, places: finalPlaces };

  } catch (error) {
    console.error("Map Search Error:", error);
    return { text: "Unable to find doctors at this moment.", places: [] };
  }
};