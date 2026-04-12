"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

// Sub-components
import { StepIndicator } from "@/components/report-form/StepIndicator";
import { ContextStep } from "@/components/report-form/ContextStep";
import { DetailsStep } from "@/components/report-form/DetailsStep";
import { EvidenceStep } from "@/components/report-form/EvidenceStep";

// Hooks & Constants
import { useReportForm } from "@/hooks/useReportForm";

const STEPS = [
  { id: 0, title: "Contexto", desc: "Sistema y Categoría" },
  { id: 1, title: "Detalles", desc: "Descripción del fallo" },
  { id: 2, title: "Evidencia", desc: "Archivos y Envío" },
];

/**
 * Main client component for report creation.
 * Uses the useReportForm hook for business logic.
 */
export function CrearReporteClient() {
  const router = useRouter();

  // ── Data Hook ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full text-foreground selection:bg-[#ff3366] selection:text-white flex flex-col md:flex-row bg-background">
      {/* ── Sidebar - Stepper ───────────────────────────────────────────────── */}
      <aside className="w-full md:w-[280px] lg:w-[310px] shrink-0 bg-card border-r border-border/40 flex flex-col p-6 md:h-screen md:sticky md:top-0 z-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground hover:text-[#ff3366] mb-8 transition-all w-fit group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Volver
        </button>

        <div className="mb-8">
          <div className="text-[#ff3366] text-[9px] font-bold tracking-[0.2em] uppercase mb-1.5 opacity-80">
            Control Master / Protocolo
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tighter leading-tight">
            Reportar <br />
            <span className="text-[#ff3366]">Fallo Técnico</span>
          </h1>
        </div>

        <StepIndicator
          steps={STEPS}
          currentStep={step}
          onStepClick={(s) => setStep(s)}
        />

        <div className="mt-auto pt-8 border-t border-border/20">
          <div className="flex items-center justify-between group cursor-pointer">
            <div>
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-tight opacity-50">
                Soporte
              </p>
              <Link
                href="https://wa.me/50683472053"
                target="_blank"
                className="text-[11px] font-medium text-foreground group-hover:text-[#ff3366] transition-all flex items-center gap-1.5"
              >
                Ricardo Jarquín
              </Link>
            </div>
            <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-[#ff3366]/10 transition-colors border border-border/10">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#ff3366]" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content - Form Steps ───────────────────────────────────────── */}
      <main className="flex-1 relative flex justify-center bg-muted/5">
        <div className="max-w-3xl w-full p-6 md:p-10 pt-12 md:pt-16 pb-24">
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

          {/* ── Navigation Buttons ─────────────────────────────────────────── */}
          <div className="flex justify-between items-center mt-10 pt-8 border-t border-border/30">
            <div>
              {step > 0 && (
                <button
                  onClick={prevStep}
                  className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Anterior
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {step < 2 ? (
                <button
                  onClick={nextStep}
                  className="bg-[#ff3366] hover:bg-[#d92b57] text-white px-7 h-11 rounded-lg font-medium shadow-lg shadow-rose-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center text-[11px] uppercase tracking-wider"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={submitReport}
                  disabled={loading}
                  className="bg-[#ff3366] hover:bg-[#d92b57] text-white px-7 h-11 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-95 text-[11px] uppercase tracking-wider disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? "Enviando..." : "Registrar Reporte"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}