import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Upload, X, Check, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportFormData } from "@/hooks/useReportForm";
import { FormStepHeader } from "./FormStepHeader";

interface EvidenceStepProps {
  formData: Pick<
    ReportFormData,
    "attachments" | "isResolved" | "dateResolved" | "sendEmail" | "emailRecipients"
  >;
  handleInputChange: (field: keyof ReportFormData, value: unknown) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export function EvidenceStep({
  formData,
  handleInputChange,
  handleFileUpload,
  uploading,
}: EvidenceStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-0 flex-1 flex-col space-y-6 md:space-y-8"
    >
      <FormStepHeader
        title="Evidencia y"
        accent="envío"
        description="Adjunta capturas si las tienes y confirma cómo quieres notificar el reporte."
      />

      <div className="grid flex-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="flex flex-col space-y-3 rounded-xl border border-border/60 bg-card/40 p-4 md:p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Archivos adjuntos (opcional)
          </p>
          <div className="flex flex-1 flex-col space-y-2">
            {formData.attachments.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/80 p-3"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                  <img
                    src={(file.data as string) || file.url}
                    className="h-full w-full object-cover"
                    alt=""
                  />
                </div>
                <span className="flex-1 truncate text-sm text-muted-foreground">
                  {file.url}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...formData.attachments];
                    next.splice(idx, 1);
                    handleInputChange("attachments", next);
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <label className="flex min-h-[140px] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/50 transition-colors hover:border-brand/50 hover:bg-brand/5 lg:min-h-[200px]">
              <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? "Subiendo…" : "Seleccionar archivos"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground/70">Máx. 4 MB</span>
              <input type="file" multiple hidden onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </section>

        <div className="flex flex-col gap-6">
        <section className="space-y-3 rounded-xl border border-border/60 bg-card/80 p-4 md:p-5">
          <div className="flex items-start gap-3 opacity-60">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-brand bg-brand/20">
              <Check className="h-3 w-3 text-brand" />
            </div>
            <div>
              <p className="text-sm text-foreground">Marcar como resuelto</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Opción desactivada por ahora; el reporte queda pendiente al crearlo.
              </p>
            </div>
          </div>
          <div className="border-t border-border/50 pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Fecha de resolución (referencia)
            </p>
            <Input
              type="datetime-local"
              value={formData.dateResolved}
              onChange={(e) => handleInputChange("dateResolved", e.target.value)}
              className="h-10 rounded-lg border-border/60 bg-background text-sm"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <button
            type="button"
            className="flex w-full items-start gap-3 text-left"
            onClick={() => handleInputChange("sendEmail", !formData.sendEmail)}
          >
            <div
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                formData.sendEmail
                  ? "border-indigo-500 bg-indigo-500"
                  : "border-border bg-background"
              )}
            >
              {formData.sendEmail && <Check className="h-3 w-3 text-white" />}
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                Enviar correo con el PDF
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Notifica a los destinatarios al registrar el reporte.
              </p>
            </div>
          </button>

          <AnimatePresence>
            {formData.sendEmail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-indigo-500/15 pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Destinatarios
                  </p>
                  <Input
                    type="text"
                    value={formData.emailRecipients}
                    onChange={(e) => handleInputChange("emailRecipients", e.target.value)}
                    className="h-10 rounded-lg border-border/60 bg-background text-sm focus-visible:ring-indigo-500/30"
                    placeholder="ingenieria@enlace.org"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        </div>
      </div>
    </motion.div>
  );
}
