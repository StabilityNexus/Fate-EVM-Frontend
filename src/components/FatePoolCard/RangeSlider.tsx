import React from 'react';

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function RangeSlider({ value, onChange, min = 0, max = 100, step = 1 }: RangeSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const gradientColor = `linear-gradient(to right, #22c55e ${percentage}%, #ef4444 ${percentage}%)`;

  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
      style={{
        background: gradientColor,
      }}
    />
  );
}