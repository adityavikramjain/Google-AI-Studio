import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { PredictionResult } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PredictionEngineProps {
  prediction: PredictionResult | null;
  hallucinationWarning: boolean;
  temperature: number;
}

export const PredictionEngine: React.FC<PredictionEngineProps> = ({ 
  prediction, 
  hallucinationWarning,
  temperature
}) => {
  if (!prediction) {
    return (
      <div className="h-full flex flex-col">
         <h3 className="font-display text-2xl text-ink-primary mb-4">The Prediction Engine</h3>
         <div className="zoom-card flex-grow flex items-center justify-center p-6 text-ink-tertiary font-mono text-sm">
            Waiting for input stream...
         </div>
      </div>
    );
  }

  // Live Temperature Re-weighting
  // We take the raw logProbabilities from the API and apply the current slider temperature
  // to visualize how the distribution flattens (High T) or sharpens (Low T).
  const { labels, dataValues, backgroundColors } = useMemo(() => {
    const rawCandidates = prediction.candidates;
    const t = Math.max(temperature, 0.01); // Prevent divide by zero

    // 1. Calculate weighted exponentials: exp(logProb / T)
    const weights = rawCandidates.map(c => Math.exp(c.logProbability / t));
    
    // 2. Sum weights for normalization
    const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);

    // 3. Normalize to percentages
    const adjustedProbs = weights.map(w => (w / totalWeight) * 100);

    const labels = rawCandidates.map(c => `"${c.token.replace(/\n/g, '\\n')}"`);
    
    const colors = rawCandidates.map(c => 
        c.token === prediction.chosenToken ? '#FF4500' : '#4A4A5A'
    );

    return { labels, dataValues: adjustedProbs, backgroundColors: colors };
  }, [prediction, temperature]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Token Probability (%)',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderRadius: 4,
        barThickness: 32,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E1E1E',
        titleFont: { family: '"JetBrains Mono"', size: 14 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.parsed.x.toFixed(2)}%`
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
            font: { family: '"Space Grotesk"' },
            color: '#6A6A7A'
        },
        max: 100,
        beginAtZero: true
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { family: '"JetBrains Mono"', size: 14 },
          color: '#0F0F1A',
          autoSkip: false
        }
      }
    },
    animation: {
      duration: 300, // Faster animation for slider responsiveness
      easing: 'easeOutQuad'
    }
  };

  // Hallucination visual override
  const containerStyle = hallucinationWarning 
    ? { backgroundColor: 'rgba(255, 69, 0, 0.1)' } 
    : {};

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-2xl text-ink-primary">The Prediction Engine</h3>
        {hallucinationWarning && (
           <div className="glow-bullet font-numeric text-xs font-bold text-accent uppercase tracking-widest">
             Risk Detected
           </div>
        )}
      </div>

      <div className="zoom-card flex-grow p-6 relative flex flex-col transition-colors duration-500" style={containerStyle}>
        
        {hallucinationWarning && (
          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur border border-accent text-accent px-4 py-2 rounded-badge shadow-glass animate-pulse">
            <p className="font-bold text-sm">Low Probability Detected.</p>
            <p className="text-xs">High Hallucination Risk.</p>
          </div>
        )}

        <div className="flex-grow min-h-[300px]">
          <Bar data={data} options={options} />
        </div>

        <div className="mt-4 pt-4 border-t border-ink-secondary/10 flex justify-between items-center text-xs font-mono text-ink-tertiary">
           <span className="flex items-center gap-2">
             Top Candidate Confidence: 
             <span className="text-ink-primary font-bold">{dataValues[0]?.toFixed(2)}%</span>
           </span>
           <span className="flex items-center gap-2">
             Temperature: 
             <span className="text-accent font-bold">{temperature.toFixed(1)}</span>
           </span>
        </div>
      </div>
    </div>
  );
};