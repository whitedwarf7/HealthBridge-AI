import { GoogleGenAI, Type } from "@google/genai";
import { TriageResponse, HealthRecord } from '../types';

// Initialize Gemini
// NOTE: In a production environment for underserved regions, we would likely proxy this 
// through a backend to protect the key and manage rate limits.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TRIAGE_MODEL = 'gemini-2.5-flash';

export const analyzeSymptoms = async (
  textInput: string, 
  imageParts: string[] = [], 
  audioPart: string | null = null,
  severityLevel: number = 0
): Promise<TriageResponse> => {
  
  const parts: any[] = [];

  // Add text with severity context
  let combinedText = textInput;
  if (severityLevel > 0) {
    const severityContext = `User self-reported severity level: ${severityLevel}/10.`;
    combinedText = combinedText ? `${combinedText}\n\n${severityContext}` : severityContext;
  }

  if (combinedText) {
    parts.push({ text: combinedText });
  }

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
      specialistNeeded: { type: Type.STRING, description: "If a doctor is needed, what kind? e.g. 'General Practitioner', 'Dermatologist'." }
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
        - Use simple, easy-to-understand language (Grade 6 reading level).
        - Take the user's self-reported severity level (1-10) into serious consideration when determining the priority/severity classification.
        - If the user provides a picture of a medication, explain what it is used for.
        - If the symptoms seem life-threatening (chest pain, severe bleeding, difficulty breathing), flag as EMERGENCY immediately.
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
      recommendedAction: "See Doctor"
    };
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
}

export const findNearbyDoctors = async (lat: number, lng: number, specialist?: string): Promise<{ text: string, places: PlaceResult[] }> => {
  try {
    // We ask for a specific format in the text response to help us parse details that might not be in the grounding chunk metadata
    const query = `Find ${specialist || 'general practitioner doctors'} and clinics near me. Sort them by distance. 
    Provide the result as a list. For each location, strictly follow this format:
    "Name: <name> // Distance: <distance> // Phone: <phone number>"
    Example: "City Clinic // 0.5 miles // 555-1234"`;
    
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

    // 2. Parse the text response to get Distance and Phone (The model uses the tool to generate this text)
    // We try to match the parsed text items with the raw chunks
    const lines = text.split('\n');
    const parsedDetails: { name: string, distance: string, phone: string }[] = [];
    
    lines.forEach(line => {
       const parts = line.split('//').map(s => s.trim());
       if (parts.length >= 2) {
         // Attempt to find Name, Distance, Phone
         const namePart = parts[0].replace(/Name:|^\d+\./gi, '').trim(); // Remove "Name:" or "1."
         const distPart = parts.find(p => p.toLowerCase().includes('distance:'))?.replace(/distance:/i, '').trim() || parts[1];
         const phonePart = parts.find(p => p.toLowerCase().includes('phone:'))?.replace(/phone:/i, '').trim() || parts[2] || '';
         
         parsedDetails.push({
           name: namePart,
           distance: distPart,
           phone: phonePart
         });
       }
    });

    // 3. Merge parsed details into raw places
    // Matching strategy: Simple substring match or fuzzy match
    const mergedPlaces = parsedDetails.map(detail => {
       // Find a chunk that matches this name
       const match = rawPlaces.find(p => p.title.toLowerCase().includes(detail.name.toLowerCase()) || detail.name.toLowerCase().includes(p.title.toLowerCase()));
       
       return {
         title: detail.name,
         uri: match ? match.uri : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.name)}`, // Fallback URI
         distance: detail.distance,
         phone: detail.phone
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