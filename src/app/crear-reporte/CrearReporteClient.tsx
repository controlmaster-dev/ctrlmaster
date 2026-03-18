"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { generateReportPDF } from "@/utils/pdfGenerator";

// Sub-components
import { StepIndicator } from "@/components/report-form/StepIndicator";
import { ContextStep } from "@/components/report-form/ContextStep";
import { DetailsStep } from "@/components/report-form/DetailsStep";
import { EvidenceStep } from "@/components/report-form/EvidenceStep";

const STEPS = [
  { id: 0, title: "Contexto", desc: "Sistema y Categoría" },
  { id: 1, title: "Detalles", desc: "Descripción del fallo" },
  { id: 2, title: "Evidencia", desc: "Archivos y Envío" }
];

export function CrearReporteClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    operatorId: "",
    operatorName: "",
    operatorEmail: "",
    problemDescription: "",
    dateStarted: "",
    dateResolved: "",
    isResolved: true, // Default to true as requested
    priority: [] as string[],
    categories: [] as string[],
    attachments: [] as any[],
    isManualDate: false,
    sendEmail: true,
    emailRecipients: "ingenieria@enlace.org, rjimenez@enlace.org"
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("enlace-user");
    if (!savedUser) { 
      router.push("/login"); 
      return; 
    }
    const user = JSON.parse(savedUser);

    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setFormData((prev) => ({
      ...prev,
      operatorId: user.id || "unknown",
      operatorName: user.name,
      operatorEmail: user.email,
      dateStarted: localIso,
      dateResolved: localIso
    }));
  }, [router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (cat: string) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      const newCats = exists ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat];
      return { ...prev, categories: newCats };
    });
  };

  const toggleSystem = (sys: string) => {
    setFormData((prev) => {
      if (sys === "Todos") {
        return { ...prev, priority: prev.priority.includes("Todos") ? [] : ["Todos"] };
      }
      let newPriority = prev.priority.filter((p) => p !== "Todos");
      if (newPriority.includes(sys)) {
        newPriority = newPriority.filter((p) => p !== sys);
      } else {
        newPriority.push(sys);
      }
      return { ...prev, priority: newPriority };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const newAttachments: any[] = [];
      for (const file of files) {
        if (file.size > 4 * 1024 * 1024) {
          toast.error(`El archivo ${file.name} es muy pesado (>4MB)`);
          continue;
        }
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
        newAttachments.push({
          url: file.name,
          type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
          data: base64
        });
      }
      setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] }));
      toast.success(`${newAttachments.length} archivo(s) agregado(s)`);
    } catch (error) {
      console.error(error);
      toast.error("Error procesando archivos");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.priority.length === 0) { toast.error("Selecciona al menos un sistema"); return; }
    if (formData.categories.length === 0) { toast.error("Selecciona al menos una categoría"); return; }
    if (!formData.problemDescription) { toast.error("Describe el problema"); return; }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        category: formData.categories.join(", "),
        priority: formData.priority.join(", "),
        dateStarted: new Date(formData.dateStarted).toISOString(),
        status: formData.isResolved ? 'resolved' : 'pending',
        emailStatus: formData.sendEmail ? 'pending' : 'none',
        emailRecipients: formData.sendEmail ? formData.emailRecipients : null,
        dateResolved: formData.isResolved ? new Date(formData.dateResolved).toISOString() : null
      };
      
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Error al guardar");
      }
      
      toast.success("Reporte creado con éxito");

      if (formData.sendEmail) {
        toast.loading("Generando PDF y enviando correo...", { id: 'sending-email' });
        try {
          const reportForPdf = {
            id: resData.id || "NEW",
            operatorName: formData.operatorName,
            operatorEmail: formData.operatorEmail,
            problemDescription: formData.problemDescription,
            dateStarted: new Date(formData.dateStarted).toISOString(),
            dateResolved: formData.isResolved ? new Date(formData.dateResolved).toISOString() : null,
            status: formData.isResolved ? 'resolved' : 'pending',
            priority: formData.priority.join(", "),
            category: formData.categories.join(", "),
            comments: [],
            reactions: []
          };

          const recipientsList = formData.emailRecipients.split(',').map((e) => e.trim()).filter((e) => e);
          const emailRes = await generateReportPDF(reportForPdf, { download: false, email: true, recipients: recipientsList });

          if (emailRes.success) {
            toast.success("Correo enviado correctamente", { id: 'sending-email' });
          } else {
            toast.error(`Error enviando correo: ${emailRes.message}`, { id: 'sending-email' });
          }
        } catch (pdfError) {
          console.error(pdfError);
          toast.error("Error al procesar el envío de correo", { id: 'sending-email' });
        }
      }

      router.push('/reportes');
    } catch (error: any) {
      console.error(error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 0 && (formData.priority.length === 0 || formData.categories.length === 0)) {
      toast.error("Completa los campos requeridos");
      return;
    }
    if (step === 1 && !formData.problemDescription) {
      toast.error("Añade una descripción");
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen w-full text-foreground selection:bg-[#ff3366] selection:text-white flex flex-col md:flex-row bg-background">
      {/* Sidebar - Stepper */}
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
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-tight opacity-50">Soporte</p>
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

      {/* Main Content - Form Steps */}
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

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-8 border-t border-border/30">
            <div>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
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
                  className="bg-[#ff3366] hover:bg-[#d92b57] text-white px-7 h-11 rounded-lg font-medium shadow-lg shadow-rose-500/10 transition-all hover:scale-[1.02] active:scale-95 flex items-center text-[11px] uppercase tracking-wider"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[#ff3366] hover:bg-[#d92b57] text-white px-7 h-11 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-95 text-[11px] uppercase tracking-wider"
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