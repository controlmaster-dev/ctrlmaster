/**
 * Custom hook for report form management.
 * Extracts business logic from CrearReporteClient.tsx.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateReportPDF } from "@/utils/pdfGenerator";
import { STORAGE_KEYS, UI_CONFIG } from "@/config/constants";

export interface Attachment {
  url: string;
  type: "IMAGE" | "VIDEO";
  data: string | ArrayBuffer | null;
}

export interface ReportFormData {
  operatorId: string;
  operatorName: string;
  operatorEmail: string;
  problemDescription: string;
  dateStarted: string;
  dateResolved: string;
  isResolved: boolean;
  priority: string[];
  categories: string[];
  attachments: Attachment[];
  isManualDate: boolean;
  sendEmail: boolean;
  emailRecipients: string;
}

export function useReportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState<ReportFormData>({
    operatorId: "",
    operatorName: "",
    operatorEmail: "",
    problemDescription: "",
    dateStarted: "",
    dateResolved: "",
    isResolved: true,
    priority: [],
    categories: [],
    attachments: [],
    isManualDate: false,
    sendEmail: true,
    emailRecipients: "ingenieria@enlace.org, rjimenez@enlace.org",
  });

  // Initialize form with current user on mount
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (!savedUserStr) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(savedUserStr);

      const now = new Date();
      // Format as local ISO (YYYY-MM-DDTHH:mm) for datetime-local input
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setFormData((prev) => ({
        ...prev,
        operatorId: user.id || "unknown",
        operatorName: user.name,
        operatorEmail: user.email,
        dateStarted: localIso,
        dateResolved: localIso,
      }));
    } catch (err) {
      console.error("Error initializing report form:", err);
    }
  }, [router]);

  const handleInputChange = useCallback((field: keyof ReportFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      const newCats = exists
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: newCats };
    });
  }, []);

  const toggleSystem = useCallback((sys: string) => {
    setFormData((prev) => {
      if (sys === "Todos") {
        return {
          ...prev,
          priority: prev.priority.includes("Todos") ? [] : ["Todos"],
        };
      }
      let newPriority = prev.priority.filter((p) => p !== "Todos");
      if (newPriority.includes(sys)) {
        newPriority = newPriority.filter((p) => p !== sys);
      } else {
        newPriority.push(sys);
      }
      return { ...prev, priority: newPriority };
    });
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        if (file.size > UI_CONFIG.MAX_FILE_SIZE) {
          toast.error(`El archivo ${file.name} es muy pesado (>4MB)`);
          continue;
        }

        const base64 = await new Promise<string | ArrayBuffer | null>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });

        newAttachments.push({
          url: file.name,
          type: file.type.startsWith("image/") ? "IMAGE" : "VIDEO",
          data: base64,
        });
      }

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments],
      }));
      toast.success(`${newAttachments.length} archivo(s) agregado(s)`);
    } catch (error) {
      toast.error("Error procesando archivos");
    } finally {
      setUploading(false);
    }
  }, []);

  const submitReport = useCallback(async () => {
    // Basic validation
    if (formData.priority.length === 0) {
      toast.error("Selecciona al menos un sistema");
      return;
    }
    if (formData.categories.length === 0) {
      toast.error("Selecciona al menos una categoría");
      return;
    }
    if (!formData.problemDescription) {
      toast.error("Describe el problema");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        category: formData.categories.join(", "),
        priority: formData.priority.join(", "),
        dateStarted: new Date(formData.dateStarted).toISOString(),
        status: formData.isResolved ? "resolved" : "pending",
        emailStatus: formData.sendEmail ? "pending" : "none",
        emailRecipients: formData.sendEmail ? formData.emailRecipients : null,
        dateResolved: formData.isResolved
          ? new Date(formData.dateResolved).toISOString()
          : null,
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Error al guardar el reporte");
      }

      toast.success("¡Reporte creado con éxito!");

      // Trigger refetch across all components that display reports
      try {
        const { triggerRefetch } = await import('./useDashboardData');
        triggerRefetch('reports');
      } catch {}

      // Handle email/pdf generation
      if (formData.sendEmail) {
        toast.loading("Generando PDF y enviando correo...", { id: "sending-email" });
        try {
          const reportForPdf = {
            id: resData.id || "NEW",
            operatorName: formData.operatorName,
            operatorEmail: formData.operatorEmail,
            problemDescription: formData.problemDescription,
            dateStarted: new Date(formData.dateStarted).toISOString(),
            dateResolved: formData.isResolved
              ? new Date(formData.dateResolved).toISOString()
              : null,
            status: formData.isResolved ? "resolved" : "pending" as any,
            priority: formData.priority.join(", "),
            category: formData.categories.join(", "),
            comments: [],
            reactions: [],
          };

          const recipientsList = formData.emailRecipients
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e);

          const emailRes = await generateReportPDF(reportForPdf, {
            download: false,
            email: true,
            recipients: recipientsList,
          });

          if (emailRes.success) {
            toast.success("Correo enviado correctamente", { id: "sending-email" });
          } else {
            toast.error(`Error enviando correo: ${emailRes.message}`, { id: "sending-email" });
          }
        } catch (pdfError) {
          console.error("PDF generation error:", pdfError);
          toast.error("Error al procesar el envío de correo", { id: "sending-email" });
        }
      }

      // Success!
      router.push("/reportes");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [formData, router]);

  const nextStep = useCallback(() => {
    if (step === 0 && (formData.priority.length === 0 || formData.categories.length === 0)) {
      toast.error("Completa los campos requeridos");
      return;
    }
    if (step === 1 && !formData.problemDescription) {
      toast.error("Añade una descripción");
      return;
    }
    setStep((s) => s + 1);
  }, [step, formData]);

  const prevStep = useCallback(() => setStep((s) => s - 1), []);

  return {
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
  };
}
