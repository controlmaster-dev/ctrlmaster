


"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { STORAGE_KEYS, UI_CONFIG } from "@/config/constants";

export interface Attachment {
  url: string;
  type: "IMAGE" | "VIDEO";
  data?: string | ArrayBuffer | null;
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


  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (!savedUserStr) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(savedUserStr);

      const now = new Date();

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

  const handleInputChange = useCallback((field: keyof ReportFormData, value: unknown) => {
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
        if (file.size > UI_CONFIG.MAX_UPLOAD_SIZE) {
          toast.error(`El archivo ${file.name} es muy pesado (>10MB)`);
          continue;
        }

        const form = new FormData();
        form.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || `No se pudo subir ${file.name}`);
        }

        newAttachments.push({
          url: uploadData.url,
          type: uploadData.type,
        });
      }

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments],
      }));
      toast.success(`${newAttachments.length} archivo(s) agregado(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error procesando archivos");
    } finally {
      setUploading(false);
    }
  }, []);

  const submitReport = useCallback(async () => {

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


      try {
        const { triggerRefetch } = await import('./useDashboardData');
        triggerRefetch('reports');
      } catch {}


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
            status: formData.isResolved ? "resolved" : "pending",
            priority: formData.priority.join(", "),
            category: formData.categories.join(", "),
            comments: [],
            reactions: [],
          };

          const recipientsList = formData.emailRecipients
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e);

          const { generateReportPDF } = await import("@/utils/pdfGenerator");
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


      router.push("/reportes");
    } catch (error: unknown) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "No se pudo enviar el reporte"}`);
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
