import React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SYSTEMS = ["Enlace", "EJTV", "Enlace USA", "Todos"];
const CATEGORIES = ["Transmisión", "Audio", "Video", "Equipos", "Software", "Falla Energética", "Otros"];

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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-8"
    >
      <div className="space-y-3 mb-10">
        <div className="h-1 w-10 bg-[#ff3366] rounded-full" />
        <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tighter leading-tight">
          Contexto <br /> del <span className="text-[#ff3366]">Fallo</span>
        </h2>
        <p className="text-muted-foreground text-sm font-normal border-l border-border/80 pl-4">
          Define el ecosistema y la naturaleza del incidente.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-foreground text-[10px] font-medium tracking-wider uppercase opacity-50">
            Sistemas Afectados / Prioridad
          </Label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SYSTEMS.map((sys) => {
              const isSelected = formData.priority.includes(sys);
              return (
                <button
                  key={sys}
                  onClick={() => toggleSystem(sys)}
                  className={cn(
                    "h-14 rounded-lg border flex flex-col items-center justify-center text-xs font-medium transition-all relative overflow-hidden group shadow-sm",
                    isSelected ? 
                      "bg-[#ff3366] border-[#ff3366] text-white shadow-lg shadow-[#ff3366]/10" : 
                      "bg-card border-border text-muted-foreground hover:border-[#ff3366]/30 hover:text-foreground hover:bg-card/80"
                  )}
                >
                  <span className="relative z-10">{sys}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-foreground text-[10px] font-medium tracking-wider uppercase opacity-50">
            Tipo de Incidencia / Categorías
          </Label>
          <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = formData.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "px-4 py-3 rounded-lg text-[10px] font-medium transition-all border",
                      active ? 
                        "bg-[#ff3366] text-white border-[#ff3366] shadow-md shadow-rose-500/10" : 
                        "bg-muted/30 border-border/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {cat} {active && <span className="ml-1.5 opacity-60 font-medium text-[8px]">✓</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-muted-foreground mt-6 font-normal opacity-40 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#ff3366]" /> Multi-selección habilitada
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
