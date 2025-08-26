import React from 'react';

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function RangeSlider({ value, onChange, min = 0, max = 100, step = 1 }: RangeSliderProps) {
  const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
  
  return (
    <div className="relative w-full">
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-custom focus:outline-none"
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
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .slider-custom:focus {
          box-shadow: 0 0 0 3px ${percentage > 50 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
        }
        
        .slider-custom::-webkit-slider-thumb {
          appearance: none;
          height: 15px;
          width: 15px;
          border-radius: 50%;
          background: ${percentage > 50 ? '#10b981' : '#ef4444'};
          cursor: pointer;
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.1),
            inset 0 1px 2px rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
          position: relative;
        }
        
        .slider-custom::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 
            0 6px 16px rgba(0, 0, 0, 0.2),
            0 0 0 4px ${percentage > 50 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'},
            inset 0 1px 2px rgba(255, 255, 255, 0.8);
          border-width: 3px;
        }
        
        .slider-custom::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        
        .slider-custom::-moz-range-thumb {
          height: 15px;
          width: 15px;
          border-radius: 50%;
          background: ${percentage > 50 ? '#10b981' : '#ef4444'};
          cursor: pointer;
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          -moz-appearance: none;
        }
        
        .slider-custom::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 
            0 6px 16px rgba(0, 0, 0, 0.2),
            0 0 0 4px ${percentage > 50 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
        }
        
        .slider-custom::-moz-range-track {
          background: transparent;
          border: none;
        }
        
        @media (prefers-color-scheme: dark) {
          .slider-custom {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .slider-custom::-webkit-slider-thumb {
            background: linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%);
            border-color: ${percentage > 50 ? '#10b981' : '#ef4444'};
            box-shadow: 
              0 4px 12px rgba(0, 0, 0, 0.4),
              0 2px 4px rgba(0, 0, 0, 0.3),
              inset 0 1px 2px rgba(255, 255, 255, 0.1);
          }
          
          .slider-custom::-webkit-slider-thumb:hover {
            box-shadow: 
              0 6px 16px rgba(0, 0, 0, 0.4),
              0 0 0 4px ${percentage > 50 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'},
              inset 0 1px 2px rgba(255, 255, 255, 0.1);
          }
          
          .slider-custom::-moz-range-thumb {
            background: linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%);
            border-color: ${percentage > 50 ? '#10b981' : '#ef4444'};
            box-shadow: 
              0 4px 12px rgba(0, 0, 0, 0.4),
              0 2px 4px rgba(0, 0, 0, 0.3);
          }
        }
      `}</style>
    </div>
  );
}