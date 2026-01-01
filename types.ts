export interface TokenCandidate {
  token: string;
  probability: number;
  logProbability: number;
}

export interface PredictionResult {
  chosenToken: string;
  candidates: TokenCandidate[];
  latencyMs: number;
  estimatedCost: number;
}

export interface AppState {
  apiKey: string | null;
  context: string;
  temperature: number;
  isProcessing: boolean;
  lastPrediction: PredictionResult | null;
  error: string | null;
  hallucinationWarning: boolean;
}