"use client"
import { memo } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckoutWizardProps {
  currentStep: number
  steps: Array<{
    id: number
    title: string
    description: string
  }>
}

export function CheckoutWizard({ currentStep, steps }: CheckoutWizardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-border/30" style={{ zIndex: 0 }} />
          <div
            className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              zIndex: 0,
            }}
          />

          {/* Step indicators */}
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id
            const isCurrent = currentStep === step.id
            const isUpcoming = currentStep < step.id

            return (
              <div key={step.id} className="flex flex-col items-center" style={{ zIndex: 1 }}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all duration-300 mb-1.5",
                    isCompleted && "bg-primary text-white shadow-md shadow-primary/25",
                    isCurrent && "bg-primary text-white ring-3 ring-primary/20 shadow-md shadow-primary/25",
                    isUpcoming && "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs">{step.id}</span>}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      (isCurrent || isCompleted) && "text-foreground",
                      isUpcoming && "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] transition-colors mt-0.5",
                      (isCurrent || isCompleted) && "text-muted-foreground",
                      isUpcoming && "text-muted-foreground/60",
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default memo(CheckoutWizard)
