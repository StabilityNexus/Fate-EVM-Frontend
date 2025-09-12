import React from 'react';

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function RangeSlider({ value, onChange, min = 0, max = 100, step = 1, disabled = false }: RangeSliderProps) {
  const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
  
  return (
    <div className="relative w-full">
      <input
        type="range"
        value={value}
        onChange={(e) => !disabled && onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider-custom focus:outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          background: `linear-gradient(to right, 
            #059669 0%, 
            #10b981 ${percentage}%, 
            #ef4444 ${percentage}%, 
            #dc2626 100%)`
        }}
      />
      
      <style jsx>{`
        .slider-custom {
          outline: none;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        
        .slider-custom:focus {
          box-shadow: 0 0 0 3px ${percentage > 50 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
        }
        
        .slider-custom:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .slider-custom::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: ${percentage > 50 ? '#10b981' : '#ef4444'};
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.2),
            0 2px 4px rgba(0, 0, 0, 0.15),
            inset 0 1px 2px rgba(255, 255, 255, 0.9);
          transition: all 0.2s ease;
          position: relative;
          border: 2px solid white;
        }
        
        .slider-custom::-webkit-slider-thumb:hover:not(:disabled) {
          transform: scale(1.15);
          box-shadow: 
            0 6px 16px rgba(0, 0, 0, 0.25),
            0 0 0 4px ${percentage > 50 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'},
            inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }
        
        .slider-custom::-webkit-slider-thumb:active:not(:disabled) {
          transform: scale(1.05);
        }
        
        .slider-custom::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: ${percentage > 50 ? '#10b981' : '#ef4444'};
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.2),
            0 2px 4px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          -moz-appearance: none;
          border: 2px solid white;
        }
        
        .slider-custom::-moz-range-thumb:hover:not(:disabled) {
          transform: scale(1.15);
          box-shadow: 
            0 6px 16px rgba(0, 0, 0, 0.25),
            0 0 0 4px ${percentage > 50 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
        }
        
        .slider-custom::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}