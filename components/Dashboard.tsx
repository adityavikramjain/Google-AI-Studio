import React, { useState } from 'react';
import { predictNextToken } from '../services/geminiService';
import { AppState, PredictionResult } from '../types';
import { ContextWindow } from './ContextWindow';
import { PredictionEngine } from './PredictionEngine';
import { Play, AlertTriangle, RefreshCcw, Activity, DollarSign } from 'lucide-react';

interface DashboardProps {
  apiKey: string;
}

const INITIAL_CONTEXT = "The artificial intelligence revolution is";

const PRESETS = [
  { label: "Sci-Fi Intro", value: "The year is 3042 and the first thing I saw when I woke up was" },
  { label: "Coding (JS)", value: "function calculateFibonacci(n) {" },
  { label: "Poetry", value: "The autumn leaves fell gently like" },
  { label: "Philosophy", value: "The true nature of consciousness is" },
  { label: "Mystery", value: "The detective looked at the shattered glass and realized" },
  { label: "Recipe", value: "To make the perfect chocolate cake, first you must" }
];

export const Dashboard: React.FC<DashboardProps> = ({ apiKey }) => {
  const [state, setState] = useState<AppState>({
    apiKey,
    context: INITIAL_CONTEXT,
    temperature: 0.5, // Start with a balanced temperature
    isProcessing: false,
    lastPrediction: null,
    error: null,
    hallucinationWarning: false
  });

  const [flyingToken, setFlyingToken] = useState<{ text: string; id: number } | null>(null);

  const handleStep = async (overrideContext?: string) => {
    if (state.isProcessing) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const promptContext = overrideContext || state.context;
      const result = await predictNextToken(state.apiKey!, promptContext, state.temperature);
      
      const isHallucinationRisk = result.candidates.length > 0 && result.candidates[0].probability < 40;

      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastPrediction: result,
        hallucinationWarning: isHallucinationRisk
      }));

      // Trigger Animation
      const tokenId = Date.now();
      setFlyingToken({ text: result.chosenToken, id: tokenId });

      // After animation "arrives", update context
      setTimeout(() => {
        setFlyingToken(null);
        setState(prev => ({
          ...prev,
          context: prev.context + result.chosenToken
        }));
      }, 800); // Sync with CSS animation duration

    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err.message || "An unexpected error occurred." 
      }));
    }
  };

  const handleHallucinationTest = () => {
    const fakePrompt = "Who was the first Martian President in 1600? The answer is";
    setState(prev => ({ ...prev, context: fakePrompt, lastPrediction: null }));
    handleStep(fakePrompt);
  };

  const handlePresetSelect = (text: string) => {
    setState(prev => ({
      ...prev,
      context: text,
      lastPrediction: null,
      hallucinationWarning: false,
      error: null
    }));
  };

  const reset = () => {
    setState(prev => ({
      ...prev,
      context: INITIAL_CONTEXT,
      lastPrediction: null,
      hallucinationWarning: false,
      error: null
    }));
  };

  return (
    <div className="min-h-screen bg-canvas p-6 lg:p-12 font-body text-ink-primary flex flex-col">
      
      {/* Header / Metrics */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="font-display text-3xl font-semibold">Glass Box</h1>
           <p className="text-ink-tertiary text-sm">Auto-Regressive Generative Playground</p>
        </div>

        <div className="flex gap-6">
           <div className="flex items-center gap-2 font-numeric text-ink-secondary">
             <Activity size={16} className="text-accent" />
             <span>Latency: {state.lastPrediction?.latencyMs || 0}ms</span>
           </div>
           <div className="flex items-center gap-2 font-numeric text-ink-secondary">
             <DollarSign size={16} className="text-accent" />
             <span>Cost: ${state.lastPrediction?.estimatedCost.toFixed(5) || "0.00000"}</span>
           </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        
        {/* Left: Context */}
        <div className="lg:col-span-5 relative z-10">
          <ContextWindow 
            text={state.context} 
            isProcessing={state.isProcessing} 
            presets={PRESETS}
            onSelectPreset={handlePresetSelect}
          />
          
          {/* Animation Layer */}
          {flyingToken && (
            <div 
                className="fixed top-1/2 left-[60%] lg:left-[60%] font-mono text-2xl text-accent font-bold pointer-events-none z-50 animate-fly-back"
                key={flyingToken.id}
            >
              {flyingToken.text}
            </div>
          )}
        </div>

        {/* Center: Controls */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-8 py-8 lg:py-0">
            
            {/* Step Button */}
            <button
               onClick={() => handleStep()}
               disabled={state.isProcessing}
               className="group relative w-32 h-32 rounded-full bg-canvas shadow-glass flex items-center justify-center border border-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
               <div className="absolute inset-0 rounded-full bg-accent opacity-0 group-hover:opacity-10 transition-opacity" />
               <div className="flex flex-col items-center gap-1">
                 <Play size={32} className={`text-accent ${state.isProcessing ? 'hidden' : 'ml-1'}`} fill="#FF4500" />
                 {state.isProcessing && (
                   <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                 )}
                 <span className="font-display font-semibold text-ink-primary mt-1">
                    {state.isProcessing ? "Thinking" : "Step"}
                 </span>
               </div>
            </button>

            {/* Temperature Slider */}
            <div className="w-full px-4 text-center">
               <label className="block font-numeric text-xs font-bold text-ink-tertiary mb-3 tracking-widest uppercase">
                 Creativity (Temp): {state.temperature.toFixed(2)}
               </label>
               <input 
                 type="range" 
                 min="0" 
                 max="2" 
                 step="0.05"
                 value={state.temperature}
                 onChange={(e) => setState(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                 className="w-full h-2 bg-ink-secondary/20 rounded-lg appearance-none cursor-pointer accent-accent"
               />
               <div className="flex justify-between text-[10px] text-ink-tertiary mt-2 font-mono">
                 <span>Deterministic</span>
                 <span>Creative (2.0)</span>
               </div>
            </div>

             {/* Utility Buttons */}
             <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleHallucinationTest}
                  disabled={state.isProcessing}
                  className="w-full py-3 px-4 border border-accent text-accent font-body font-medium rounded-badge hover:bg-accent hover:text-white transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <AlertTriangle size={16} />
                  Test Fake Knowledge
                </button>

                <button
                  onClick={reset}
                  className="w-full py-3 px-4 text-ink-tertiary font-body font-medium rounded-badge hover:bg-black/5 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCcw size={16} />
                  Reset Context
                </button>
             </div>
        </div>

        {/* Right: Prediction */}
        <div className="lg:col-span-5 relative z-0">
          <PredictionEngine 
             prediction={state.lastPrediction} 
             hallucinationWarning={state.hallucinationWarning}
             temperature={state.temperature}
          />
        </div>
      </div>

      {/* Error Toast */}
      {state.error && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-ink-primary text-white px-6 py-4 rounded-badge shadow-2xl flex items-center gap-3 z-50">
          <AlertTriangle className="text-accent" />
          <p className="font-body text-sm">{state.error}</p>
          <button onClick={() => setState(prev => ({...prev, error: null}))} className="ml-4 hover:text-accent">
            &times;
          </button>
        </div>
      )}
    </div>
  );
};