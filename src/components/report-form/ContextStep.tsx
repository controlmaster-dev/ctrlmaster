import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FormStepHeader } from "./FormStepHeader";

const SYSTEMS = ["Enlace", "EJTV", "Enlace USA", "Todos"];
const CATEGORIES = [
  "Transmisión",
  "Audio",
  "Video",
  "Equipos",
  "Software",
  "Falla Energética",
  "Otros",
];

interface ContextStepProps {
  formData: {
    priority: string[];
    categories: string[];
  };
  toggleSystem: (sys: string) => void;
  toggleCategory: (cat: string) => void;
}

export function ContextStep({ formData, toggleSystem, toggleCategory }: ContextStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <FormStepHeader
        title="Contexto del"
        accent="fallo"
        description="Indica qué sistemas están afectados y el tipo de incidencia."
      />

      <div className="space-y-6">
        <section className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Sistemas afectados
          </p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {SYSTEMS.map((sys) => {
              const isSelected = formData.priority.includes(sys);
              return (
                <button
                  key={sys}
                  type="button"
                  onClick={() => toggleSystem(sys)}
                  className={cn(
                    "h-11 rounded-lg border text-sm transition-colors",
                    isSelected
                      ? "border-[#FF0C60] bg-[#FF0C60] text-white"
                      : "border-border/60 bg-card text-muted-foreground hover:border-[#FF0C60]/40 hover:text-foreground"
                  )}
                >
                  {sys}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Tipo de incidencia
          </p>
          <div className="rounded-xl border border-border/60 bg-card/80 p-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = formData.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-xs transition-colors",
                      active
                        ? "border-[#FF0C60] bg-[#FF0C60] text-white"
                        : "border-border/60 bg-muted/25 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Puedes elegir varias categorías.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
