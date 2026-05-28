"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

import { StepIndicator } from "@/components/report-form/StepIndicator";
import { ContextStep } from "@/components/report-form/ContextStep";
import { DetailsStep } from "@/components/report-form/DetailsStep";
import { EvidenceStep } from "@/components/report-form/EvidenceStep";
import { useReportForm } from "@/hooks/useReportForm";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 0, title: "Contexto", desc: "Sistema y categoría" },
  { id: 1, title: "Detalles", desc: "Descripción del fallo" },
  { id: 2, title: "Evidencia", desc: "Archivos y envío" },
];

export function CrearReporteClient() {
  const router = useRouter();

  const {
    formData,
    loading,
    uploading,
    step,
    setStep,
    nextStep,
    prevStep,
    handleInputChange,
    toggleCategory,
    toggleSystem,
    handleFileUpload,
    submitReport,
  } = useReportForm();

  return (
    <div className="crear-reporte-ui relative flex min-h-screen flex-col bg-background text-foreground selection:bg-[#FF0C60] selection:text-white md:flex-row">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#FF0C60]/6 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      <aside className="relative z-10 flex w-full shrink-0 flex-col border-b border-border/60 bg-card/80 p-5 md:h-screen md:w-[280px] md:border-b-0 md:border-r lg:w-[300px] md:sticky md:top-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="group mb-6 flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#FF0C60]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Volver
        </button>

        <div className="mb-8">
          <p className="text-xs text-muted-foreground">Nuevo reporte</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
            Reportar <span className="text-[#FF0C60]">incidencia</span>
          </h1>
        </div>

        <StepIndicator steps={STEPS} currentStep={step} onStepClick={setStep} />

        <div className="mt-auto hidden border-t border-border/50 pt-6 md:block">
          <p className="text-xs text-muted-foreground">Soporte</p>
          <Link
            href="https://wa.me/50683472053"
            target="_blank"
            className="mt-1 flex items-center gap-1 text-sm text-foreground transition-colors hover:text-[#FF0C60]"
          >
            Ricardo Jarquín
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>

      <main className="relative z-10 flex min-h-[calc(100dvh)] flex-1 flex-col overflow-y-auto md:h-screen md:min-h-0">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 pb-24 md:px-10 md:py-8 lg:max-w-6xl">
          <div className="flex min-h-0 flex-1 flex-col">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <ContextStep
                  key="step0"
                  formData={formData}
                  toggleSystem={toggleSystem}
                  toggleCategory={toggleCategory}
                />
              )}
              {step === 1 && (
                <DetailsStep
                  key="step1"
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              )}
              {step === 2 && (
                <EvidenceStep
                  key="step2"
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleFileUpload={handleFileUpload}
                  uploading={uploading}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="mt-auto flex shrink-0 items-center justify-between border-t border-border/50 pt-6 md:pt-8">
            {step > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={prevStep}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
            ) : (
              <span />
            )}

            {step < 2 ? (
              <Button
                type="button"
                size="sm"
                onClick={nextStep}
                className="bg-[#FF0C60] text-white hover:bg-[#E00A54]"
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={submitReport}
                disabled={loading}
                className="bg-[#FF0C60] text-white hover:bg-[#E00A54]"
              >
                {loading ? "Enviando…" : "Registrar reporte"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
