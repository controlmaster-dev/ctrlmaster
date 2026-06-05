import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Upload, X, Check, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportFormData } from "@/hooks/useReportForm";
import { FormStepHeader } from "./FormStepHeader";
import { ReportPdfPreview } from "./ReportPdfPreview";

interface EvidenceStepProps {
  formData: Pick<
    ReportFormData,
    | "attachments"
    | "isResolved"
    | "dateResolved"
    | "useManualResolveDate"
    | "sendEmail"
    | "emailRecipients"
    | "priority"
    | "categories"
    | "problemDescription"
    | "operatorName"
    | "operatorEmail"
    | "dateStarted"
  >;
  handleInputChange: (field: keyof ReportFormData, value: unknown) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  onUseNow: () => void;
  uploading: boolean;
}

export function EvidenceStep({
  formData,
  handleInputChange,
  handleFileUpload,
  removeAttachment,
  onUseNow,
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
        description="Adjunta archivos, define el estado y revisa cómo quedará el PDF antes de registrar."
      />

      <div className="grid flex-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <ReportPdfPreview
          className="lg:sticky lg:top-4"
          data={{
            operatorName: formData.operatorName,
            operatorEmail: formData.operatorEmail,
            priority: formData.priority,
            categories: formData.categories,
            problemDescription: formData.problemDescription,
            dateStarted: formData.dateStarted,
            dateResolved: formData.dateResolved,
            isResolved: formData.isResolved,
            useManualResolveDate: formData.useManualResolveDate,
          }}
        />

        <div className="flex flex-col gap-4">
        <section className="flex flex-col space-y-3 rounded-xl border border-border/60 bg-card/40 p-4 md:p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Archivos adjuntos (opcional)
          </p>
          <div className="flex flex-1 flex-col space-y-2">
            {formData.attachments.map((file, idx) => (
              <div
                key={`${file.url}-${idx}`}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/80 p-3"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                  {file.type === "IMAGE" ? (
                    <img
                      src={(file.data as string) || file.url}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                      VIDEO
                    </div>
                  )}
                </div>
                <span className="flex-1 truncate text-sm text-muted-foreground">
                  {file.url.split("/").pop() || file.url}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <label className="flex min-h-[120px] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/50 transition-colors hover:border-brand/50 hover:bg-brand/5 lg:min-h-[160px]">
              <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? "Subiendo…" : "Seleccionar archivos"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground/70">Máx. 10 MB</span>
              <input type="file" multiple hidden onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </section>

          <section className="space-y-3 rounded-xl border border-border/60 bg-card/80 p-4 md:p-5">
            <button
              type="button"
              className="flex w-full items-start gap-3 text-left"
              onClick={() => {
                const next = !formData.isResolved;
                handleInputChange("isResolved", next);
                if (next && !formData.useManualResolveDate) onUseNow();
              }}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  formData.isResolved
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-border bg-background"
                )}
              >
                {formData.isResolved && <Check className="h-3 w-3 text-white" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ya quedó resuelto
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Si lo marcas, el PDF incluirá tiempo de caída con segundos.
                </p>
              </div>
            </button>

            <AnimatePresence>
              {formData.isResolved && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden border-t border-border/50 pt-3"
                >
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange("useManualResolveDate", false);
                        onUseNow();
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        !formData.useManualResolveDate
                          ? "border-emerald-500/50 bg-emerald-500/10 text-foreground"
                          : "border-border/60 text-muted-foreground"
                      )}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Resuelto al enviar (ahora)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("useManualResolveDate", true)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        formData.useManualResolveDate
                          ? "border-emerald-500/50 bg-emerald-500/10 text-foreground"
                          : "border-border/60 text-muted-foreground"
                      )}
                    >
                      Fecha de resolución manual
                    </button>
                  </div>
                  {formData.useManualResolveDate && (
                    <Input
                      type="datetime-local"
                      step="1"
                      value={formData.dateResolved}
                      onChange={(e) => handleInputChange("dateResolved", e.target.value)}
                      className="h-10 rounded-lg border-border/60 bg-background text-sm"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
                  Enviar correo con PDF
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Notifica al equipo al registrar el reporte.
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
                      Destinatarios (separados por coma)
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
