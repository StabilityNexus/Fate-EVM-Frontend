"use client";

import React from "react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const StepIndicator = ({
  currentStep,
  totalSteps,
  stepTitles,
}: StepIndicatorProps) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step < currentStep
                  ? "bg-green-500 border-green-500 text-white"
                  : step === currentStep
                  ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                  : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500"
              }`}
            >
              {step < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{step}</span>
              )}
            </div>
            {step < totalSteps && (
              <div
                className={`h-1 w-20 mx-2 ml-7 transition-all ${
                  step < currentStep
                    ? "bg-green-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3">
        {stepTitles.map((title, index) => (
          <div
            key={index}
            className={`text-sm font-medium transition-all ${
              index + 1 === currentStep
                ? "text-black dark:text-white"
                : index + 1 < currentStep
                ? "text-green-600"
                : "text-gray-500"
            }`}
          >
            {title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
