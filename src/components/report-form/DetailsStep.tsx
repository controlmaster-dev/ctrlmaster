import React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReportFormData } from "@/hooks/useReportForm";

interface DetailsStepProps {
  formData: Pick<ReportFormData, 'problemDescription' | 'isManualDate' | 'dateStarted'>;
  handleInputChange: (field: keyof ReportFormData, value: any) => void;
}

export function DetailsStep({ formData, handleInputChange }: DetailsStepProps) {
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
          Detalles <br /> <span className="text-[#ff3366]">Técnicos</span>
        </h2>
        <p className="text-muted-foreground text-sm font-normal border-l border-border/80 pl-4">
          Documenta el comportamiento del sistema.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-foreground text-[10px] font-medium tracking-wider uppercase opacity-50">
            Bitácora del Incidente
          </Label>
          <Textarea
            value={formData.problemDescription}
            onChange={(e) => handleInputChange('problemDescription', e.target.value)}
            className="min-h-[160px] bg-card border border-border focus:border-[#ff3366] text-foreground resize-none rounded-xl p-6 text-base font-normal placeholder:text-muted-foreground/30 transition-all outline-none"
            placeholder="Describa el fallo, mensajes de error, equipo afectado..."
          />
        </div>

        <div className="space-y-4">
          <Label className="text-foreground text-[10px] font-medium tracking-wider uppercase opacity-50">
            Cronología / Registro de Tiempo
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => handleInputChange('isManualDate', false)}
              className={cn(
                "h-16 px-6 rounded-lg border text-xs font-medium text-left transition-all leading-relaxed",
                !formData.isManualDate ? 
                  "bg-[#ff3366] border-[#ff3366] text-white shadow-lg shadow-[#ff3366]/10" : 
                  "bg-card border-border text-muted-foreground hover:bg-card/80 hover:border-foreground/20"
              )}
            >
              Tiempo Real
              <br />
              <span className="text-[9px] opacity-70 font-normal font-mono">Sincronizado con la hora del servidor.</span>
            </button>
            <button
              onClick={() => handleInputChange('isManualDate', true)}
              className={cn(
                "h-16 px-6 rounded-lg border text-xs font-medium text-left transition-all leading-relaxed",
                formData.isManualDate ? 
                  "bg-[#ff3366] border-[#ff3366] text-white shadow-lg shadow-[#ff3366]/10" : 
                  "bg-card border-border text-muted-foreground hover:bg-card/80 hover:border-foreground/20"
              )}
            >
              Entrada Manual
              <br />
              <span className="text-[9px] opacity-70 font-normal font-mono">Selecciona un tiempo especifico.</span>
            </button>
          </div>
          
          {formData.isManualDate && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-1"
            >
              <Input
                type="datetime-local"
                value={formData.dateStarted}
                onChange={(e) => handleInputChange('dateStarted', e.target.value)}
                className="bg-card border border-border text-foreground h-12 text-lg font-medium rounded-lg focus:border-[#ff3366] px-4"
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
