import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Discover High Potential Locations & Leads
 * Uses Gemini with Maps and Search tools to find raw data.
 */
export const scoutLocationsAndLeads = async (
  niche: string,
  serviceOffering: string,
  onLog: (msg: string) => void
): Promise<string> => {
  onLog(`Initializing strategic planning for niche: ${niche}...`);
  
  // First, we ask the AI to pick a high-potential location dynamically if it wasn't specified.
  const prompt = `
    Act as a global business intelligence scout.
    
    My Services: ${serviceOffering}
    Target Niche: ${niche}
    
    Task:
    1. Identify a "High Potential Area" in the world right now where this niche is booming but digitally underserved (e.g., a tourist hotspot with old-school businesses).
    2. Use Google Maps to find 5-7 specific businesses in that area.
    3. Use Google Search to attempt to find their website, email, or contact status. 
    **CRITICAL**: Prioritize businesses where you can find an Email Address or WhatsApp number.
    
    4. **GAP ANALYSIS**: Focus on finding clients who **DON'T** have what I offer.
       - If I offer "AI Voice Agent", look for businesses that force you to call to book (no online booking).
       - If I offer "Chatbot", look for businesses with no instant reply mechanism.
       - If I offer "App/Website", look for businesses with no website or a non-mobile friendly one.
    
    Return a detailed report listing these businesses, their estimated digital maturity, contact details, and SPECIFICALLY what tech they are missing.
  `;

  onLog("Contacting Gemini 2.5 Flash for global reconnaissance...");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [
          { googleMaps: {} },
          { googleSearch: {} }
        ],
      }
    });

    onLog("Raw intelligence received. Grounding sources verified.");
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const sources = chunks
        .map(c => c.web?.uri || c.maps?.uri)
        .filter(Boolean)
        .slice(0, 3);
      if (sources.length > 0) {
        onLog(`Sources accessed: ${sources.join(', ')}...`);
      }
    }

    return response.text || "No data returned from scout.";
  } catch (error) {
    console.error("Scouting error:", error);
    throw new Error(`Scouting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Step 2: Structure the Data & Generate Outreach
 * Takes the raw text report from Step 1 and creates structured data + email drafts.
 */
export const structureLeadData = async (
  rawReport: string,
  serviceOffering: string,
  onLog: (msg: string) => void
): Promise<Lead[]> => {
  onLog("Processing intelligence report. Generating email drafts and strategy tips...");

  const prompt = `
    You are an Expert Sales Copywriter and Data Analyst. 
    Convert the following unstructured intelligence report into a strict JSON array.
    
    MY SERVICE OFFERING: ${serviceOffering}
    REPORT:
    ${rawReport}
    
    For each business found, you MUST generate:
    1. A "potentialScore" (0-100) based on how badly they need my service.
    2. An "emailDraft": A short, high-converting cold email (Subject + Body) specifically pitching my service to THEM based on their specific weaknesses.
    3. "outreachTips": 2-3 specific strategic tips to get them to reply.
    4. "platformStatus": A short 2-4 word tag describing the main technical gap. 
       **EXAMPLES**: "No AI Chatbot", "Manual Phone Booking", "No Mobile App", "Socials Only", "Non-Responsive Site", "No Website", "Booking Friction". 
       Do NOT use generic terms like "Outdated". Be specific about what is missing relative to my service.
    5. "followUpEmail": A polite, value-focused follow-up email draft (Subject + Body) to send 3 days later if they don't reply. It should gently remind them of the value proposition.
    
    OUTPUT REQUIREMENTS:
    Return ONLY a JSON array. Each object must follow this schema:
    {
      "name": "Business Name",
      "type": "e.g., Cafe, Salon",
      "location": "City/Area",
      "description": "Short description",
      "website": "URL or 'None'",
      "contactInfo": "Email, Phone, WhatsApp, or 'Not listed' - prioritize finding these",
      "potentialScore": number,
      "reasoning": "Why they need the service",
      "platformStatus": "e.g. No AI Chatbot | Manual Phone Booking | No App",
      "emailDraft": "Subject: ... \n\nBody: ...",
      "followUpEmail": "Subject: ... \n\nBody: ...",
      "outreachTips": "Tip 1: ... Tip 2: ..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              location: { type: Type.STRING },
              description: { type: Type.STRING },
              website: { type: Type.STRING },
              contactInfo: { type: Type.STRING },
              potentialScore: { type: Type.INTEGER },
              reasoning: { type: Type.STRING },
              platformStatus: { type: Type.STRING },
              emailDraft: { type: Type.STRING },
              followUpEmail: { type: Type.STRING },
              outreachTips: { type: Type.STRING }
            },
            required: ['name', 'location', 'potentialScore', 'platformStatus', 'emailDraft', 'followUpEmail', 'outreachTips']
          }
        }
      }
    });

    onLog("Data structure complete. Parsing JSON...");
    
    const jsonStr = response.text || "[]";
    const leads = JSON.parse(jsonStr);
    
    return leads.map((l: any, index: number) => ({
      ...l,
      id: `lead-${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Structuring error:", error);
    throw new Error("Failed to parse lead data.");
  }
};