"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, Check, ChevronRight, Mail, Settings } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateReportPDF } from "@/utils/pdfGenerator"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";























const SYSTEMS = ["Enlace", "EJTV", "Enlace USA", "Todos"];

const CATEGORIES = [
  "Transmisión", "Audio", "Video", "Equipos", "Software", "Falla Energética", "Otros"];


const STEPS = [
  { id: 0, title: "Contexto", desc: "Sistema y Categoría" },
  { id: 1, title: "Detalles", desc: "Descripción del fallo" },
  { id: 2, title: "Evidencia", desc: "Archivos y Envío" }];


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
    isResolved: false,
    priority: [],
    categories: [],
    attachments: [],
    isManualDate: false,
    sendEmail: true,
    emailRecipients: "ingenieria@enlace.org, rjimenez@enlace.org"
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("enlace-user");
    if (!savedUser) { router.push("/login"); return; }
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (cat) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      const newCats = exists ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat];
      return { ...prev, categories: newCats };
    });
  };

  const toggleSystem = (sys) => {
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

  const handleFileUpload = async (e) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const newAttachments: { url: string; type: string; data: unknown }[] = [];
      for (const file of files as File[]) {
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
    } catch (error) {
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
    _jsxs("div", {
      className: "min-h-screen w-full text-foreground selection:bg-[#ff3366] selection:text-white flex flex-col md:flex-row overflow-hidden relative", children: [
        _jsxs("div", {
          className: "w-full md:w-[350px] lg:w-[400px] shrink-0 bg-card border-r border-border flex flex-col p-8 md:h-screen z-20 shadow-xl shadow-background/50", children: [
            _jsxs("button", {
              onClick: () => router.back(), className: "flex items-center gap-2 text-[10px] font-medium tracking-wide text-muted-foreground hover:text-[#ff3366] mb-12 transition-all w-fit group", children: [
                _jsx(ArrowLeft, { className: "w-4 h-4 transition-transform group-hover:-translate-x-1" }), " Volver al Inicio"]
            }
            ),
            _jsxs("div", {
              className: "mb-12", children: [
                _jsx("div", { className: "text-[#ff3366] text-[10px] font-normal tracking-wider mb-3", children: "Protocolo de Incidencias" }),
                _jsxs("h1", { className: "text-4xl font-bold text-foreground tracking-tighter leading-none", children: ["Reportar ", _jsx("br", {}), _jsx("span", { className: "text-[#ff3366]", children: "Fallo T\xE9cnico" })] }),
                _jsx("p", { className: "text-xs text-muted-foreground mt-4 font-normal leading-relaxed", children: "Sigue los pasos para registrar el incidente en la base de datos central." })]
            }
            ),
            _jsxs("div", {
              className: "space-y-0 relative", children: [
                _jsx("div", { className: "absolute left-[19px] top-4 bottom-10 w-[1px] bg-border/50 -z-10" }),
                STEPS.map((s, idx) => {
                  const isActive = step === idx;
                  const isDone = step > idx;
                  return (
                    _jsxs("div", {
                      className: "flex gap-6 pb-12 last:pb-0 items-start group cursor-pointer", onClick: () => step > idx ? setStep(idx) : null, children: [
                        _jsx("div", {
                          className: cn(
                            "w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium border-2 transition-all duration-500 bg-card",
                            isActive ? "border-[#ff3366] text-[#ff3366] shadow-[0_0_20px_rgba(255,51,102,0.2)] scale-110" :
                              isDone ? "border-[#ff3366] bg-[#ff3366] text-white" : "border-border text-muted-foreground/30"
                          ), children:
                            isDone ? _jsx(Check, { className: "w-5 h-5 stroke-[2]" }) : idx + 1
                        }
                        ),
                        _jsxs("div", {
                          className: cn("pt-1.5 transition-all duration-500", isActive ? "opacity-100 translate-x-1" : "opacity-30"), children: [
                            _jsx("h3", { className: cn("text-sm font-medium leading-none mb-2", isActive ? "text-foreground" : "text-muted-foreground"), children: s.title }),
                            _jsx("p", { className: "text-[10px] text-muted-foreground font-normal", children: s.desc })]
                        }
                        )]
                    }, idx
                    ));

                })]
            }
            ),
            _jsx("div", {
              className: "mt-auto hidden md:block", children:
                _jsxs("div", {
                  className: "p-5 rounded-md bg-muted/20 border border-border border-dashed", children: [
                    _jsx("p", { className: "text-[10px] font-normal text-muted-foreground mb-2", children: "Soporte Directo" }),
                    _jsxs(Link, {
                      href: "https://wa.me/50683472053", target: "_blank", className: "text-sm font-medium text-foreground hover:text-[#ff3366] transition-all flex items-center gap-2 tracking-tight", children: ["Ricardo Jarqu\xEDn ",
                        _jsx(ChevronRight, { className: "w-4 h-4" })]
                    }
                    )]
                }
                )
            }
            )]
        }
        ),
        _jsx("div", {
          className: "flex-1 overflow-y-auto relative flex items-center justify-center min-h-screen", children:
            _jsxs("div", {
              className: "max-w-4xl w-full p-8 md:p-16 pt-24 pb-32", children: [
                _jsxs(AnimatePresence, {
                  mode: "wait", children: [
                    step === 0 &&
                    _jsxs(motion.div, {

                      initial: { opacity: 0, x: 20 },
                      animate: { opacity: 1, x: 0 },
                      exit: { opacity: 0, x: -20 },
                      transition: { duration: 0.3, ease: "easeOut" },
                      className: "space-y-10", children: [

                        _jsxs("div", {
                          className: "space-y-4 mb-14", children: [
                            _jsx("div", { className: "h-1 w-12 bg-[#ff3366] rounded-full" }),
                            _jsxs("h2", { className: "text-5xl md:text-7xl font-bold text-foreground tracking-tighter leading-none", children: ["Contexto ", _jsx("br", {}), " del ", _jsx("span", { className: "text-[#ff3366]", children: "Fallo" })] }),
                            _jsx("p", { className: "text-muted-foreground text-lg font-normal border-l-2 border-border pl-6", children: "Define el ecosistema y la naturaleza del incidente." })]
                        }
                        ),
                        _jsxs("div", {
                          className: "space-y-12", children: [
                            _jsxs("div", {
                              className: "space-y-6", children: [
                                _jsx(Label, { className: "text-foreground text-xs font-medium tracking-wide", children: "Sistemas Afectados / Prioridad" }),
                                _jsx("div", {
                                  className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children:
                                    SYSTEMS.map((sys) => {
                                      const isSelected = formData.priority.includes(sys);
                                      return (
                                        _jsxs("button", {

                                          onClick: () => toggleSystem(sys),
                                          className: cn(
                                            "h-16 rounded-md border-2 flex items-center justify-center text-xs font-medium transition-all relative overflow-hidden group",
                                            isSelected ?
                                              "bg-[#ff3366] border-[#ff3366] text-white shadow-xl shadow-[#ff3366]/20 scale-[1.02]" :
                                              "bg-card/50 border-border text-muted-foreground hover:border-[#ff3366]/50 hover:text-foreground hover:bg-card"
                                          ), children: [

                                            sys,
                                            isSelected && _jsx("div", { className: "absolute top-1 right-1", children: _jsx(Check, { className: "w-3 h-3 stroke-[2]" }) })]
                                        }, sys
                                        ));

                                    })
                                }
                                )]
                            }
                            ),
                            _jsxs("div", {
                              className: "space-y-6", children: [
                                _jsx(Label, { className: "text-foreground text-xs font-medium tracking-wide", children: "Tipo de Incidencia / Categor\xEDas" }),
                                _jsxs("div", {
                                  className: "p-8 rounded-md bg-card/30 border border-border ring-1 ring-border shadow-2xl shadow-background", children: [
                                    _jsx("div", {
                                      className: "flex flex-wrap gap-3", children:
                                        CATEGORIES.map((cat) => {
                                          const active = formData.categories.includes(cat);
                                          return (
                                            _jsxs("button", {

                                              onClick: () => toggleCategory(cat),
                                              className: cn(
                                                "px-5 py-3 rounded-md text-[10px] font-medium transition-all border-2",
                                                active ?
                                                  "bg-foreground text-background border-foreground scale-105" :
                                                  "bg-muted/10 border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/20"
                                              ), children: [

                                                cat, " ", active && "✓"]
                                            }, cat
                                            ));

                                        })
                                    }
                                    ),
                                    _jsx("p", { className: "text-[10px] text-muted-foreground mt-6 font-normal opacity-50", children: "Multi-selecci\xF3n habilitada" })]
                                }
                                )]
                            }
                            )]
                        }
                        )]
                    }, "step0"
                    ),

                    step === 1 &&
                    _jsxs(motion.div, {

                      initial: { opacity: 0, x: 20 },
                      animate: { opacity: 1, x: 0 },
                      exit: { opacity: 0, x: -20 },
                      transition: { duration: 0.3, ease: "easeOut" },
                      className: "space-y-10", children: [

                        _jsxs("div", {
                          className: "space-y-4 mb-14", children: [
                            _jsx("div", { className: "h-1 w-12 bg-[#ff3366] rounded-full" }),
                            _jsxs("h2", { className: "text-5xl md:text-7xl font-bold text-foreground tracking-tighter leading-none", children: ["Detalles ", _jsx("br", {}), " ", _jsx("span", { className: "text-[#ff3366]", children: "T\xE9cnicos" })] }),
                            _jsx("p", { className: "text-muted-foreground text-lg font-normal border-l-2 border-border pl-6", children: "Documenta el comportamiento del sistema." })]
                        }
                        ),
                        _jsxs("div", {
                          className: "space-y-12", children: [
                            _jsxs("div", {
                              className: "space-y-6", children: [
                                _jsx(Label, { className: "text-foreground text-xs font-medium tracking-wide", children: "Bit\xE1cora del Incidente" }),
                                _jsx(Textarea, {
                                  value: formData.problemDescription,
                                  onChange: (e) => handleInputChange('problemDescription', e.target.value),
                                  className: "min-h-[300px] bg-card border-2 border-border focus:border-[#ff3366] text-foreground resize-none rounded-md p-8 text-lg font-normal placeholder:text-muted-foreground/30 transition-colors",
                                  placeholder: "Describa el fallo, mensajes de error, equipo afectado..."
                                }
                                )]
                            }
                            ),
                            _jsxs("div", {
                              className: "space-y-6", children: [
                                _jsx(Label, { className: "text-foreground text-xs font-medium tracking-wide", children: "Cronolog\xEDa / Registro de Tiempo" }),
                                _jsxs("div", {
                                  className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                                    _jsxs("button", {
                                      onClick: () => handleInputChange('isManualDate', false),
                                      className: cn(
                                        "h-20 px-8 rounded-md border-2 text-[10px] font-medium text-left transition-all leading-relaxed",
                                        !formData.isManualDate ?
                                          "bg-[#ff3366] border-[#ff3366] text-white shadow-xl shadow-[#ff3366]/20" :
                                          "bg-card/50 border-border text-muted-foreground hover:bg-card hover:border-foreground/30"
                                      ), children: [
                                        "Tiempo Real ",
                                        _jsx("br", {}), _jsx("span", { className: "text-[8px] opacity-70", children: "Sincronizado con el servidor" })]
                                    }
                                    ),
                                    _jsxs("button", {
                                      onClick: () => handleInputChange('isManualDate', true),
                                      className: cn(
                                        "h-20 px-8 rounded-md border-2 text-[10px] font-medium text-left transition-all leading-relaxed",
                                        formData.isManualDate ?
                                          "bg-[#ff3366] border-[#ff3366] text-white shadow-xl shadow-[#ff3366]/20" :
                                          "bg-card/50 border-border text-muted-foreground hover:bg-card hover:border-foreground/30"
                                      ), children: [
                                        "Entrada Manual ",
                                        _jsx("br", {}), _jsx("span", { className: "text-[8px] opacity-70", children: "Definir hora espec\xEDfica" })]
                                    }
                                    )]
                                }
                                ),
                                formData.isManualDate &&
                                _jsx(motion.div, {
                                  initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, children:
                                    _jsx(Input, {
                                      type: "datetime-local",
                                      value: formData.dateStarted,
                                      onChange: (e) => handleInputChange('dateStarted', e.target.value),
                                      className: "bg-card border-2 border-border text-foreground h-16 text-xl font-normal rounded-md focus:border-[#ff3366] transition-colors"
                                    }
                                    )
                                }
                                )]
                            }

                            )]
                        }
                        )]
                    }, "step1"
                    ),

                    step === 2 &&
                    _jsxs(motion.div, {

                      initial: { opacity: 0, x: 20 },
                      animate: { opacity: 1, x: 0 },
                      exit: { opacity: 0, x: -20 },
                      transition: { duration: 0.3, ease: "easeOut" },
                      className: "space-y-10", children: [

                        _jsxs("div", {
                          className: "space-y-4 mb-14", children: [
                            _jsx("div", { className: "h-1 w-12 bg-[#ff3366] rounded-full" }),
                            _jsxs("h2", { className: "text-5xl md:text-7xl font-bold text-foreground tracking-tighter leading-none", children: ["Cierre y ", _jsx("br", {}), " ", _jsx("span", { className: "text-[#ff3366]", children: "Evidencia" })] }),
                            _jsx("p", { className: "text-muted-foreground text-lg font-normal border-l-2 border-border pl-6", children: "Validaci\xF3n visual y confirmaci\xF3n final." })]
                        }
                        ),
                        _jsxs("div", {
                          className: "space-y-12", children: [
                            _jsxs("div", {
                              className: "space-y-6", children: [
                                _jsx(Label, { className: "text-foreground text-xs font-medium tracking-wide", children: "Material Gr\xE1fico (Opcional)" }),
                                _jsx("div", {
                                  className: "space-y-4", children:
                                    formData.attachments.map((file, idx) =>
                                      _jsxs("div", {
                                        className: "flex items-center gap-6 p-5 rounded-md bg-card border-2 border-border group", children: [
                                          _jsx("div", {
                                            className: "w-16 h-16 rounded-sm bg-muted shrink-0 overflow-hidden ring-1 ring-border", children:
                                              _jsx("img", { src: file.data || file.url, className: "w-full h-full object-cover filter contrast-125" })
                                          }
                                          ),
                                          _jsxs("div", {
                                            className: "flex-1", children: [
                                              _jsxs("span", { className: "text-[10px] font-medium text-muted-foreground block mb-1", children: ["Archivo ", idx + 1] }),
                                              _jsx("span", { className: "text-xs font-medium text-foreground truncate block", children: file.url })]
                                          }
                                          ),
                                          _jsx("button", {
                                            onClick: () => { const A = [...formData.attachments]; A.splice(idx, 1); handleInputChange('attachments', A); }, className: "w-10 h-10 flex items-center justify-center rounded-md hover:bg-rose-500 hover:text-white text-muted-foreground transition-all", children:
                                              _jsx(X, { className: "w-5 h-5 stroke-[2]" })
                                          }
                                          )]
                                      }, idx
                                      )
                                    )
                                }
                                ),
                                _jsxs("label", {
                                  className: "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-md hover:border-[#ff3366] hover:bg-[#ff3366]/5 transition-all cursor-pointer bg-card/30 group ring-1 ring-transparent hover:ring-[#ff3366]/20", children: [
                                    _jsx("div", {
                                      className: "w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-4 group-hover:bg-[#ff3366]/10 transition-colors", children:
                                        _jsx(Upload, { className: "w-6 h-6 text-muted-foreground group-hover:text-[#ff3366] transition-colors" })
                                    }
                                    ),
                                    _jsx("span", { className: "text-xs font-medium text-muted-foreground group-hover:text-foreground", children: "Soltar o seleccionar evidencia" }),
                                    _jsx("span", { className: "text-[9px] text-muted-foreground/50 mt-2 font-normal", children: "M\xE1ximo 4MB por archivo" }),
                                    _jsx("input", { type: "file", multiple: true, hidden: true, onChange: handleFileUpload, disabled: uploading })]
                                }
                                )]
                            }
                            ),


                            _jsxs("div", {
                              className: "p-8 bg-card border-2 border-border rounded-md space-y-6 ring-1 ring-border shadow-xl shadow-background/50", children: [
                                _jsxs("div", {
                                  className: "flex items-start gap-5", children: [
                                    _jsx("div", {
                                      className: cn("w-6 h-6 rounded-sm border-2 flex items-center justify-center cursor-pointer transition-all mt-1", formData.isResolved ? "bg-[#ff3366] border-[#ff3366] scale-110 shadow-lg shadow-rose-500/20" : "border-muted-foreground/30"), onClick: () => handleInputChange('isResolved', !formData.isResolved), children:
                                        formData.isResolved && _jsx(Check, { className: "w-4 h-4 text-white stroke-[2]" })
                                    }
                                    ),
                                    _jsxs("div", {
                                      className: "flex-1 cursor-pointer", onClick: () => handleInputChange('isResolved', !formData.isResolved), children: [
                                        _jsx("span", { className: "text-sm font-medium text-foreground block tracking-tight mb-1", children: "Situaci\xF3n Resuelta" }),
                                        _jsx("span", { className: "text-[10px] text-muted-foreground font-normal leading-relaxed", children: "Marca esta opci\xF3n si el incidente ha sido mitigado o solucionado completamente al momento de este reporte." })]
                                    }
                                    )]
                                }
                                ),
                                _jsx(AnimatePresence, {
                                  children:
                                    formData.isResolved &&
                                    _jsx(motion.div, {
                                      initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: "overflow-hidden", children:
                                        _jsxs("div", {
                                          className: "pt-6 border-t border-border", children: [
                                            _jsx(Label, { className: "text-foreground text-[10px] font-medium mb-3 block", children: "Marca de Tiempo de Resoluci\xF3n" }),
                                            _jsx(Input, { type: "datetime-local", value: formData.dateResolved, onChange: (e) => handleInputChange('dateResolved', e.target.value), className: "bg-card border-2 border-border text-foreground h-12 text-base font-normal rounded-md focus:border-[#ff3366]" })]
                                        }
                                        )
                                    }
                                    )
                                }

                                )]
                            }
                            ),


                            _jsxs("div", {
                              className: "p-8 bg-card border-2 border-border rounded-md space-y-6 ring-1 ring-border shadow-xl shadow-background/50", children: [
                                _jsxs("div", {
                                  className: "flex items-start gap-5", children: [
                                    _jsx("div", {
                                      className: cn("w-6 h-6 rounded-sm border-2 flex items-center justify-center cursor-pointer transition-all mt-1", formData.sendEmail ? "bg-indigo-500 border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20" : "border-muted-foreground/30"), onClick: () => handleInputChange('sendEmail', !formData.sendEmail), children:
                                        formData.sendEmail && _jsx(Check, { className: "w-4 h-4 text-white stroke-[2]" })
                                    }
                                    ),
                                    _jsxs("div", {
                                      className: "flex-1 cursor-pointer", onClick: () => handleInputChange('sendEmail', !formData.sendEmail), children: [
                                        _jsxs("div", {
                                          className: "flex items-center gap-2 mb-1", children: [
                                            _jsx(Mail, { className: "w-4 h-4 text-indigo-400" }),
                                            _jsx("span", { className: "text-sm font-medium text-foreground tracking-tight", children: "Notificaci\xF3n Autom\xE1tica" })]
                                        }
                                        ),
                                        _jsx("span", { className: "text-[10px] text-muted-foreground font-normal leading-relaxed", children: "Enviar un correo con el PDF del reporte a los interesados al finalizar el registro." })]
                                    }
                                    )]
                                }
                                ),
                                _jsx(AnimatePresence, {
                                  children:
                                    formData.sendEmail &&
                                    _jsx(motion.div, {
                                      initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: "overflow-hidden", children:
                                        _jsxs("div", {
                                          className: "pt-6 border-t border-border", children: [
                                            _jsxs(Label, {
                                              className: "text-foreground text-[10px] font-medium mb-3 flex items-center gap-2", children: [
                                                _jsx(Settings, { className: "w-3 h-3" }), " Destinatarios (Separados por coma)"]
                                            }
                                            ),
                                            _jsx(Input, {
                                              type: "text",
                                              value: formData.emailRecipients,
                                              onChange: (e) => handleInputChange('emailRecipients', e.target.value),
                                              className: "bg-card border-2 border-border text-foreground h-12 text-sm font-normal rounded-md focus:border-indigo-500 placeholder:text-muted-foreground/30",
                                              placeholder: "ejemplo@enlace.org, otro@enlace.org"
                                            }
                                            ),
                                            _jsx("p", { className: "text-[10px] text-muted-foreground mt-2 italic", children: "Se enviar\xE1 copia oculta al operador que registra." })]
                                        }
                                        )
                                    }
                                    )
                                }

                                )]
                            }
                            )]
                        }
                        )]
                    }, "step2"
                    )]
                }

                ),
                _jsxs("div", {
                  className: "flex justify-between items-center mt-16 pt-10 border-t-2 border-border", children: [
                    _jsx("div", {
                      children:
                        step > 0 &&
                        _jsxs("button", {
                          onClick: () => setStep((s) => s - 1), className: "text-[10px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2", children: [
                            _jsx(ArrowLeft, { className: "w-4 h-4" }), " Fase Anterior"]
                        }
                        )
                    }

                    ),
                    _jsx("div", {
                      className: "flex gap-4", children:
                        step < 2 ?
                          _jsxs("button", { onClick: nextStep, className: "bg-[#ff3366] hover:bg-[#d92b57] text-white px-12 h-16 rounded-md font-bold shadow-2xl shadow-rose-500/20 transition-all hover:scale-[1.05] active:scale-95 flex items-center text-sm", children: ["Fase Siguiente ", _jsx(ChevronRight, { className: "w-5 h-5 ml-3" })] }) :

                          _jsx("button", { onClick: handleSubmit, disabled: loading, className: "bg-foreground hover:bg-foreground/90 text-background px-12 h-16 rounded-md font-bold transition-all hover:scale-[1.05] active:scale-95 text-sm ring-4 ring-foreground/10", children: loading ? "Sincronizando..." : "Registrar Reporte" })
                    }

                    )]
                }
                )]
            }
            )
        }
        )]
    }
    ));

}