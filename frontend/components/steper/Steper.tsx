"use client";
import { Check } from "lucide-react";
import React from "react";

interface Step {
  label: string;
}

interface CustomStepperProps {
  steps: Step[];
  currentStep: number;
}

const CustomStepper: React.FC<CustomStepperProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className="w-full px-2 sm:px-4">
      <div className="flex items-center justify-between mx-auto max-w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index + 1;
          const isActive = currentStep === index + 1;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-1 w-fit">
                <div
                  className={
                    isActive ? "p-1 border-2 border-primary rounded-4xl" : ""
                  }
                >
                  <div
                    className={`flex items-center justify-center rounded-full 
                    ${isCompleted || isActive ? "bg-primary" : "bg-[#DCDCDC]"}
                    w-7 h-7 sm:w-8 sm:h-8`}
                  >
                    {isCompleted || isActive ? (
                      <Check className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span
                        className={`font-bold ${
                          isActive ? "text-primbg-primary" : "text-foreground"
                        } text-xs sm:text-sm`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`hidden sm:block text-[10px] sm:text-xs font-bold text-center ${
                    isCompleted || isActive
                      ? "text-primbg-primary"
                      : "text-foreground"
                  }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 flex justify-center items-center">
                  <div
                    className={`h-0.5 w-full ${
                      currentStep > index + 1 ? "bg-primary" : "bg-primary"
                    }`}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CustomStepper;
