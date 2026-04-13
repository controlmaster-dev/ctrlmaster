import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  desc: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="space-y-0 relative">
      <div className="absolute left-[15px] top-4 bottom-8 w-[1px] bg-border/20 -z-10" />
      {steps.map((s, idx) => {
        const isActive = currentStep === idx;
        const isDone = currentStep > idx;
        
        return (
          <div
            key={idx}
            className="flex gap-4 pb-8 last:pb-0 items-start group cursor-pointer"
            onClick={() => (isDone ? onStepClick(idx) : null)}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium border-2 transition-all duration-300",
                isActive ? "border-[#ff3366] text-[#ff3366] bg-[#ff3366]/5 shadow-[0_0_15px_rgba(255,51,102,0.1)]" :
                isDone ? "border-[#ff3366] bg-[#ff3366] text-white" : "border-border/40 bg-muted/30 text-muted-foreground/30"
              )}
            >
              {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
            </div>
            <div className={cn("pt-1 transition-all duration-300", isActive ? "opacity-100 translate-x-0.5" : "opacity-30")}>
              <h3 className={cn("text-[11px] font-medium leading-none mb-1.5", isActive ? "text-foreground" : "text-muted-foreground")}>
                {s.title}
              </h3>
              <p className="text-[9px] text-muted-foreground font-normal">
                {s.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
