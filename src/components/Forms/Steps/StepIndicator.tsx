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
  if (totalSteps <= 1) return null; // Hide the indicator if there's only one step

  return (
    <div className="w-full mb-8">
      {/* Container for the circles and lines */}
      <div className="flex items-center">
        {stepTitles.map((title, index) => {
          const step = index + 1;
          const isCurrentStep = step === currentStep;
          const isCompletedStep = step < currentStep;

          return (
            <React.Fragment key={step}>
              {/* Line before the circle */}
              {index > 0 && (
                <div
                  className={`h-1 mb-8 md:mb-10 flex-1 mx-2 md:mx-4 transition-all ${
                    isCompletedStep ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
              {/* Circle container */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompletedStep
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrentStep
                      ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500"
                  }`}
                >
                  {isCompletedStep ? (
                    <Check className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <span className="text-xs md:text-sm font-medium">{step}</span>
                  )}
                </div>
                {/* Title */}
                <div
                  className={`text-xs md:text-sm text-center font-medium mt-2 md:mt-3 whitespace-nowrap transition-all ${
                    isCurrentStep
                      ? "text-black dark:text-white"
                      : isCompletedStep
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {title}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
