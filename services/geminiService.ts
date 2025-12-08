import { GoogleGenAI, Type } from "@google/genai";
import { TriageResponse, HealthRecord, UserProfile } from '../types';

// Initialize Gemini
// NOTE: In a production environment for underserved regions, we would likely proxy this 
// through a backend to protect the key and manage rate limits.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TRIAGE_MODEL = 'gemini-2.5-flash';

export const analyzeSymptoms = async (
  textInput: string, 
  imageParts: string[] = [], 
  audioPart: string | null = null,
  severityLevel: number = 0,
  userProfile?: UserProfile
): Promise<TriageResponse> => {
  
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
  try {
    const prompt = `Translate the following JSON fields to English: summary, advice, recommendedAction, specialistNeeded. 
    Keep severity, emergencyNumber and detectedLanguage as is.
    
    Input JSON:
    ${JSON.stringify(original)}`;

    const response = await ai.models.generateContent({
      model: TRIAGE_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             summary: { type: Type.STRING },
             severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] },
             advice: { type: Type.STRING },
             recommendedAction: { type: Type.STRING },
             specialistNeeded: { type: Type.STRING },
             emergencyNumber: { type: Type.STRING },
             detectedLanguage: { type: Type.STRING }
          }
        }
      }
    });
    
    const translated = JSON.parse(response.text || "{}");
    // Ensure we keep the detected language tag of the original to know what we translated from, 
    // or we can update it to "English" but for UI toggle "English" might be confusing if we use it to show "Translate to English".
    // Let's keep the original detected language logic in UI state.
    return { ...original, ...translated };
  } catch (error) {
    console.error("Translation Error", error);
    return original;
  }
};

export const analyzeHealthRecord = async (imageBase64: string): Promise<Partial<HealthRecord>> => {
   const base64Data = imageBase64.split(',')[1] || imageBase64;
   
   try {
    const response = await ai.models.generateContent({
      model: TRIAGE_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: "Analyze this medical document image. Identify if it is a prescription, lab report, or other. Extract the title (e.g., 'Amoxicillin Prescription' or 'Blood Test Results') and a 1-sentence summary of key details. If it is a PRESCRIPTION, extract the list of medicines including name, dosage, frequency, and specific notes." }
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
  try {
    const specialistTerm = specialist || 'general practitioner doctors';
    const radiusText = radiusKm ? `within ${radiusKm} kilometers` : '';
    const openNowText = openNow ? 'Only include locations that are currently OPEN.' : '';

    // We ask for a specific format in the text response to help us parse details that might not be in the grounding chunk metadata
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
    
    // 1. Extract base places from Grounding Chunks (reliable for URIs and Titles)
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

    // 2. Parse the text response to get Distance, Phone, and Open Status
    const lines = text.split('\n');
    const parsedDetails: { name: string, distance: string, phone: string, status: string }[] = [];
    
    lines.forEach(line => {
       const parts = line.split('//').map(s => s.trim());
       if (parts.length >= 2) {
         // Attempt to find Name, Distance, Phone, Status
         const namePart = parts[0].replace(/Name:|^\d+\./gi, '').trim(); // Remove "Name:" or "1."
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

    // 3. Merge parsed details into raw places
    const mergedPlaces = parsedDetails.map(detail => {
       // Find a chunk that matches this name
       const match = rawPlaces.find(p => p.title.toLowerCase().includes(detail.name.toLowerCase()) || detail.name.toLowerCase().includes(p.title.toLowerCase()));
       
       return {
         title: detail.name,
         uri: match ? match.uri : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.name)}`, // Fallback URI
         distance: detail.distance,
         phone: detail.phone,
         openStatus: detail.status
       };
    });

    // Fallback: If parsing failed completely (e.g. model didn't follow format), return raw chunks
    const finalPlaces = mergedPlaces.length > 0 ? mergedPlaces : rawPlaces;

    return { text, places: finalPlaces };

  } catch (error) {
    console.error("Map Search Error:", error);
    return { text: "Unable to find doctors at this moment.", places: [] };
  }
};