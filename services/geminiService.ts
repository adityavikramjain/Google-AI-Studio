import { GoogleGenAI } from "@google/genai";
import { PredictionResult, TokenCandidate } from "../types";

// Helper to calculate approximate cost (estimate averaged)
const COST_PER_1K_CHARS = 0.00001875; 

// Models to try in order.
// We prioritize gemini-3-flash-preview as requested.
const MODEL_CANDIDATES = [
  'gemini-3-flash-preview', // Primary requested model
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro-002',    
  'gemini-1.5-flash-002',  
  'gemini-2.0-flash',
  'gemini-flash-latest'
];

export const predictNextToken = async (
  apiKey: string,
  context: string,
  temperature: number
): Promise<PredictionResult> => {
  const ai = new GoogleGenAI({ apiKey });
  
  let lastError: any = null;
  let successfulModel = '';

  for (const modelName of MODEL_CANDIDATES) {
    const start = performance.now();
    try {
      // STRATEGY: Few-Shot Prompting
      // We feed the model fake examples of "Completion" tasks to force it into completion mode.
      const response = await ai.models.generateContent({
        model: modelName, 
        contents: [
          { role: 'user', parts: [{ text: "The quick brown" }] },
          { role: 'model', parts: [{ text: " fox" }] },
          { role: 'user', parts: [{ text: "To be or not to" }] },
          { role: 'model', parts: [{ text: " be" }] },
          { role: 'user', parts: [{ text: "I enjoy walking in the" }] },
          { role: 'model', parts: [{ text: " rain" }] },
          { role: 'user', parts: [{ text: context }] }
        ],
        config: {
          temperature: temperature,
          maxOutputTokens: 1,
          responseLogprobs: true,
          logprobs: 5, // Get top 5 candidates
          systemInstruction: "You are a pure text completion engine. You are NOT a chat assistant. You must continue the stream of text provided by the user. Do not repeat the input. Do not start a new sentence unless the previous one is finished. Output ONLY the immediate next likely token.",
        }
      });

      const end = performance.now();
      const latencyMs = Math.round(end - start);
      successfulModel = modelName;
      
      // Extract candidates
      const candidates: TokenCandidate[] = [];
      const modelCandidates = response.candidates?.[0];
      
      const topCandidates = modelCandidates?.logprobsResult?.topCandidates;
      const chosenCandidates = modelCandidates?.logprobsResult?.chosenCandidates;

      if (topCandidates && topCandidates.length > 0) {
        const firstTokenLogprobs = topCandidates[0].candidates;
        if (firstTokenLogprobs) {
            firstTokenLogprobs.forEach((c: any) => {
              const tokenStr = c.token || '';
              const logProb = c.logProbability || -100;
              const prob = Math.exp(logProb) * 100;
              candidates.push({ token: tokenStr, probability: prob, logProbability: logProb });
            });
        }
      } else if (chosenCandidates && chosenCandidates.length > 0) {
         chosenCandidates.forEach((c: any) => {
            const tokenStr = c.token || '';
            const logProb = c.logProbability || -100;
            const prob = Math.exp(logProb) * 100;
            candidates.push({ token: tokenStr, probability: prob, logProbability: logProb });
         });
      }

      // Identify the chosen token
      const chosenTokenText = modelCandidates?.content?.parts?.[0]?.text || "";
      
      // Fallback if logprobs are missing entirely but we got text
      if (candidates.length === 0 && chosenTokenText) {
          candidates.push({ token: chosenTokenText, probability: 100, logProbability: 0 });
      }

      // Sort descending
      candidates.sort((a, b) => b.probability - a.probability);

      const estimatedCost = (context.length + chosenTokenText.length) * (COST_PER_1K_CHARS / 1000);

      // Return immediately on success
      return {
        chosenToken: chosenTokenText,
        candidates,
        latencyMs,
        estimatedCost
      };

    } catch (error: any) {
      console.warn(`Attempt with ${modelName} failed:`, error.message);
      lastError = error;
      
      // If it's a critical auth error, don't keep trying models
      if (error.message?.includes("API key not valid") || error.message?.includes("403")) {
          throw error;
      }
      
      // If it's 404 (Not Found) or 400 (Logprobs not supported), we continue to next model
      continue;
    }
  }

  // If we exhaust all models
  console.error("All model attempts failed.", lastError);
  if (lastError?.message?.includes("404") || lastError?.message?.includes("NOT_FOUND")) {
      throw new Error(`Could not find a compatible model. Tried: ${MODEL_CANDIDATES.join(', ')}. Please check your API key access.`);
  }
  if (lastError?.message?.includes("Logprobs")) {
      throw new Error("Logprobs feature is currently unavailable for the models accessible by your key.");
  }
  
  throw new Error(lastError?.message || "Failed to generate token after multiple attempts.");
};