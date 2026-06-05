"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UI_CONFIG } from "@/config/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toDatetimeLocalValue, parseDatetimeLocal } from "@/lib/datetimeLocal";
import { formatReportDisplayId } from "@/lib/reportCode";
import {
  REPORT_DESCRIPTION_MAX_CHARS,
  sanitizeReportDescription,
} from "@/lib/reportPdfLimits";

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
  useManualStartDate: boolean;
  useManualResolveDate: boolean;
  sendEmail: boolean;
  emailRecipients: string;
}

export function useReportForm() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
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
    isResolved: false,
    priority: [],
    categories: [],
    attachments: [],
    useManualStartDate: false,
    useManualResolveDate: false,
    sendEmail: true,
    emailRecipients: "ingenieria@enlace.org, rjimenez@enlace.org",
  });

  const refreshNowDates = useCallback(() => {
    const now = toDatetimeLocalValue();
    setFormData((prev) => ({
      ...prev,
      dateStarted: now,
      dateResolved: now,
    }));
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const now = toDatetimeLocalValue();
    setFormData((prev) => ({
      ...prev,
      operatorId: user.id || "unknown",
      operatorName: user.name,
      operatorEmail: user.email,
      dateStarted: now,
      dateResolved: now,
    }));
  }, [router, user, isAuthLoading]);

  const handleInputChange = useCallback((field: keyof ReportFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
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
      let next = prev.priority.filter((p) => p !== "Todos");
      if (next.includes(sys)) {
        next = next.filter((p) => p !== sys);
      } else {
        next = [...next, sys];
      }
      return { ...prev, priority: next };
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
      e.target.value = "";
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
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
    if (!formData.problemDescription.trim()) {
      toast.error("Describe el problema");
      return;
    }
    if (formData.problemDescription.length > REPORT_DESCRIPTION_MAX_CHARS) {
      toast.error(
        `La descripción supera el máximo de ${REPORT_DESCRIPTION_MAX_CHARS} caracteres para el PDF`
      );
      return;
    }

    const problemDescription = sanitizeReportDescription(formData.problemDescription);

    setLoading(true);
    try {
      const now = new Date();
      const dateStarted = formData.useManualStartDate
        ? parseDatetimeLocal(formData.dateStarted)
        : now;

      let dateResolved: Date | null = null;
      if (formData.isResolved) {
        dateResolved = formData.useManualResolveDate
          ? parseDatetimeLocal(formData.dateResolved)
          : now;
        if (dateResolved.getTime() < dateStarted.getTime()) {
          dateResolved = now;
        }
      }

      const payload = {
        operatorId: formData.operatorId,
        operatorName: formData.operatorName,
        operatorEmail: formData.operatorEmail,
        problemDescription,
        category: formData.categories.join(", "),
        priority: formData.priority.join(", "),
        dateStarted: dateStarted.toISOString(),
        status: formData.isResolved ? "resolved" : "pending",
        emailStatus: formData.sendEmail ? "pending" : "none",
        emailRecipients: formData.sendEmail ? formData.emailRecipients : null,
        dateResolved: dateResolved?.toISOString() ?? null,
        attachments: formData.attachments,
      };

      let res: Response | null = null;
      let resData: Record<string, unknown> = {};

      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        resData = (await res.json()) as Record<string, unknown>;
        if (res.ok || res.status !== 503) break;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }

      if (!res?.ok) {
        throw new Error(
          (typeof resData.error === "string" && resData.error) ||
            "Error al guardar el reporte"
        );
      }

      const reportCode = formatReportDisplayId(
        String(resData.id ?? ""),
        resData.code as string | null | undefined
      );
      toast.success(`Reporte ${reportCode} creado correctamente`);

      try {
        const { triggerRefetch } = await import("./useDashboardData");
        triggerRefetch("reports");
      } catch {}

      if (formData.sendEmail) {
        toast.loading("Generando PDF y enviando correo...", { id: "sending-email" });
        try {
          const reportForPdf = {
            id: String(resData.id ?? ""),
            code: resData.code as string | null | undefined,
            operatorName: formData.operatorName,
            operatorEmail: formData.operatorEmail,
            problemDescription,
            dateStarted: dateStarted.toISOString(),
            dateResolved: dateResolved?.toISOString() ?? null,
            status: formData.isResolved ? "resolved" : "pending",
            priority: formData.priority.join(", "),
            category: formData.categories.join(", "),
            comments: [],
            reactions: [],
          };

          const recipientsList = formData.emailRecipients
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);

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
      toast.error(
        error instanceof Error ? error.message : "No se pudo enviar el reporte"
      );
    } finally {
      setLoading(false);
    }
  }, [formData, router]);

  const nextStep = useCallback(() => {
    if (step === 0 && (formData.priority.length === 0 || formData.categories.length === 0)) {
      toast.error("Selecciona sistema y categoría");
      return;
    }
    if (step === 1 && !formData.problemDescription.trim()) {
      toast.error("Añade una descripción");
      return;
    }
    if (step === 1 && formData.problemDescription.length > REPORT_DESCRIPTION_MAX_CHARS) {
      toast.error(
        `Máximo ${REPORT_DESCRIPTION_MAX_CHARS} caracteres en la descripción (límite del PDF)`
      );
      return;
    }
    if (step === 1 && !formData.useManualStartDate) {
      refreshNowDates();
    }
    setStep((s) => s + 1);
  }, [step, formData, refreshNowDates]);

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
    removeAttachment,
    refreshNowDates,
    submitReport,
  };
}
