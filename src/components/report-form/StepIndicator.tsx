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
    <nav className="relative space-y-0" aria-label="Pasos del formulario">
      <div className="absolute bottom-6 left-[15px] top-4 -z-10 w-px bg-border/40" />
      {steps.map((s, idx) => {
        const isActive = currentStep === idx;
        const isDone = currentStep > idx;

        return (
          <button
            key={s.id}
            type="button"
            disabled={!isDone && !isActive}
            onClick={() => isDone && onStepClick(idx)}
            className={cn(
              "flex w-full gap-3 pb-6 text-left last:pb-0",
              isDone && "cursor-pointer",
              !isDone && !isActive && "cursor-default"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-xs transition-colors",
                isActive && "border-brand bg-brand/10 text-brand",
                isDone && "border-brand bg-brand text-white",
                !isActive && !isDone && "border-border/50 bg-muted/30 text-muted-foreground"
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            <div className={cn("pt-0.5", !isActive && "opacity-50")}>
              <p
                className={cn(
                  "text-sm",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {s.title}
              </p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
