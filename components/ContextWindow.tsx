import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface Preset {
  label: string;
  value: string;
}

interface ContextWindowProps {
  text: string;
  isProcessing: boolean;
  presets?: Preset[];
  onSelectPreset?: (text: string) => void;
}

export const ContextWindow: React.FC<ContextWindowProps> = ({ 
  text, 
  isProcessing,
  presets,
  onSelectPreset 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [text]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-2xl text-ink-primary">The Context Window</h3>
        
        {presets && onSelectPreset ? (
          <div className="relative group">
             <select 
               onChange={(e) => {
                 if(e.target.value) onSelectPreset(e.target.value);
                 e.target.value = ""; // Reset select visual state after selection
               }}
               className="appearance-none bg-white border border-ink-secondary/20 text-ink-tertiary text-xs font-mono pl-3 pr-8 py-1.5 rounded-full cursor-pointer hover:border-accent hover:text-accent focus:outline-none focus:border-accent transition-colors"
               defaultValue=""
             >
               <option value="" disabled>Load Preset...</option>
               {presets.map((p) => (
                 <option key={p.label} value={p.value}>{p.label}</option>
               ))}
             </select>
             <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none group-hover:text-accent transition-colors" />
          </div>
        ) : (
          <span className="text-xs font-mono text-ink-tertiary px-3 py-1 bg-white border border-ink-secondary/20 rounded-full">
            Token Stream Input
          </span>
        )}
      </div>
      
      <div className="zoom-card flex-grow p-6 overflow-hidden relative flex flex-col">
        <div className="overflow-y-auto pr-2 custom-scrollbar flex-grow">
          <div className="font-mono text-lg leading-relaxed text-ink-primary whitespace-pre-wrap">
            {text}
            {isProcessing && (
              <span className="inline-block w-3 h-5 ml-1 bg-accent animate-pulse align-middle" />
            )}
            <div ref={bottomRef} />
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};