import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Extract medications from prescription text
export const extractMedicationsFromPrescription = async (ocrText) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Extract medication information from the following prescription text. 
    Return the result as a JSON array with the following structure:
    [
      {
        "medicine_name": "Medicine Name",
        "dosage": "Dosage (e.g., 500mg, 10ml)",
        "frequency": "How often to take (e.g., 2 times per day, once daily)",
        "duration": "Duration (e.g., 7 days, 2 weeks)",
        "instructions": "Special instructions (e.g., take with food, before meals)",
        "timing": ["08:00", "20:00"] // Suggested timing based on frequency
      }
    ]

    Prescription Text:
    ${ocrText}

    Only return valid JSON. If no medications are found, return an empty array [].
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error("Gemini API error:", error);
    return [];
  }
};

// General chatbot functionality
export const chatWithGemini = async (userMessage, context = "") => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are a helpful health assistant. Provide accurate, helpful, and safe health information.
    Always remind users to consult healthcare professionals for medical advice.
    
    ${context ? `Context: ${context}\n` : ""}
    
    User Question: ${userMessage}
    
    Please provide a helpful response while being mindful of medical disclaimers.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini chat error:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
};

// Health-specific chatbot
export const healthChatbot = async (userMessage, userContext = {}) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const context = `
    User Profile:
    - Name: ${userContext.name || "User"}
    - Age: ${userContext.age || "Not provided"}
    - Blood Group: ${userContext.bloodGroup || "Not provided"}
    - Allergies: ${userContext.allergies?.join(", ") || "None"}
    - Existing Conditions: ${userContext.conditions?.join(", ") || "None"}
    - Current Medications: ${userContext.medications?.map(m => `${m.name} (${m.dosage})`).join(", ") || "None"}
    `;

    const prompt = `
    You are a specialized health assistant for a family health dashboard. 
    The user has provided their health context below. Provide personalized, helpful responses.
    
    IMPORTANT: Always include medical disclaimers and recommend consulting healthcare professionals for serious concerns.
    
    FORMATTING REQUIREMENTS:
    - Use proper indentation for lists and sections
    - Use **bold text** for important points, symptoms, and warnings
    - Use bullet points (*) for lists of symptoms, causes, or recommendations
    - Use numbered lists (1., 2., 3.) for step-by-step instructions
    - Add line breaks between different sections
    - Use clear headings with **bold** formatting
    - Structure your response with proper spacing and organization
    
    ${context}
    
    User Question: ${userMessage}
    
    Provide a helpful, personalized response with proper formatting, indentation, and clear structure while being mindful of the user's health context.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Health chatbot error:", error);
    return "I'm sorry, I'm having trouble processing your health-related question right now. Please try again later or consult your healthcare provider.";
  }
}; 