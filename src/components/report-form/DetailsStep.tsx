import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReportFormData } from "@/hooks/useReportForm";
import { FormStepHeader } from "./FormStepHeader";

interface DetailsStepProps {
  formData: Pick<ReportFormData, "problemDescription" | "isManualDate" | "dateStarted">;
  handleInputChange: (field: keyof ReportFormData, value: unknown) => void;
}

export function DetailsStep({ formData, handleInputChange }: DetailsStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-0 flex-1 flex-col space-y-6 md:space-y-8"
    >
      <FormStepHeader
        title="Detalles"
        accent="técnicos"
        description="Describe qué pasó y cuándo ocurrió el incidente."
      />

      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-8">
        <section className="flex min-h-[200px] flex-col space-y-2 lg:min-h-[min(50vh,420px)]">
          <p className="text-xs font-medium text-muted-foreground">
            Descripción del problema
          </p>
          <Textarea
            value={formData.problemDescription}
            onChange={(e) => handleInputChange("problemDescription", e.target.value)}
            className="min-h-[180px] flex-1 resize-none rounded-lg border-border/60 bg-card/80 p-4 text-sm focus-visible:ring-[#FF0C60]/30 md:min-h-[220px] lg:min-h-0"
            placeholder="Ej.: se cayó el audio en el canal principal, mensaje de error en consola…"
          />
        </section>

        <section className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4 md:p-5 lg:self-start">
          <p className="text-xs font-medium text-muted-foreground">
            Fecha y hora del incidente
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleInputChange("isManualDate", false)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                !formData.isManualDate
                  ? "border-[#FF0C60] bg-[#FF0C60] text-white"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block">Ahora</span>
              <span className="mt-0.5 block text-xs opacity-80">
                Usa la hora del servidor
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange("isManualDate", true)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                formData.isManualDate
                  ? "border-[#FF0C60] bg-[#FF0C60] text-white"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block">Fecha manual</span>
              <span className="mt-0.5 block text-xs opacity-80">
                Elige día y hora específicos
              </span>
            </button>
          </div>

          {formData.isManualDate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <Input
                type="datetime-local"
                value={formData.dateStarted}
                onChange={(e) => handleInputChange("dateStarted", e.target.value)}
                className="h-10 rounded-lg border-border/60 bg-card/80 text-sm"
              />
            </motion.div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
