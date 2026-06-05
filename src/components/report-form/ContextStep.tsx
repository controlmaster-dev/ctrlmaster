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
      className="flex min-h-0 flex-1 flex-col space-y-6 md:space-y-8"
    >
      <FormStepHeader
        title="Contexto del"
        accent="fallo"
        description="Indica qué sistemas están afectados y el tipo de incidencia."
      />

      <div className="grid flex-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="flex flex-col space-y-3 rounded-xl border border-border/60 bg-card/40 p-4 md:p-5 lg:min-h-[280px]">
          <p className="text-xs font-medium text-muted-foreground">
            Sistemas afectados
          </p>
          <div className="grid flex-1 grid-cols-2 gap-2 sm:gap-3">
            {SYSTEMS.map((sys) => {
              const isSelected = formData.priority.includes(sys);
              return (
                <button
                  key={sys}
                  type="button"
                  onClick={() => toggleSystem(sys)}
                  className={cn(
                    "min-h-[3.25rem] rounded-lg border text-sm transition-colors sm:min-h-14",
                    isSelected
                      ? "border-brand bg-brand text-white"
                      : "border-border/60 bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground"
                  )}
                >
                  {sys}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col space-y-3 rounded-xl border border-border/60 bg-card/40 p-4 md:p-5 lg:min-h-[280px]">
          <p className="text-xs font-medium text-muted-foreground">
            Tipo de incidencia
          </p>
          <div className="flex flex-1 flex-col">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const active = formData.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "min-h-11 rounded-md border px-3 py-2.5 text-xs transition-colors sm:text-sm",
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-border/60 bg-muted/25 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <p className="mt-auto pt-3 text-xs text-muted-foreground">
              Puedes elegir varias categorías.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
