import React, { useState } from 'react';

interface ApiKeyGatewayProps {
  onInitialize: (key: string) => void;
}

export const ApiKeyGateway: React.FC<ApiKeyGatewayProps> = ({ onInitialize }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().length > 10) {
      onInitialize(inputKey.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-canvas">
      <div className="zoom-card p-12 max-w-md w-full text-center border-t-4 border-accent">
        <h1 className="font-display text-4xl mb-2 text-ink-primary">Glass Box</h1>
        <p className="font-body text-ink-secondary mb-8 text-sm uppercase tracking-widest">
          Generative AI Runtime
        </p>

        <h2 className="font-display text-2xl mb-6 text-ink-primary">Initialize System</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Paste Gemini API Key"
              className="w-full p-4 bg-white border border-ink-secondary rounded-badge font-mono text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputKey}
            className="w-full py-4 mt-2 bg-accent text-ink-inverse font-body font-semibold rounded-badge shadow-accent-glow hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect to Mainframe
          </button>
        </form>
        
        <p className="mt-6 text-xs text-ink-tertiary font-body">
          Your key is used locally for this session and is never stored.
        </p>
      </div>
    </div>
  );
};