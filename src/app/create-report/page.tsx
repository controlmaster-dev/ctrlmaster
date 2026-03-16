"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";

import usersData from "@/data/users.json";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";

export default function CreateReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    operatorEmail: "",
    problemDescription: "",
    dateStarted: "",
    dateResolved: "",
    isResolved: false,
    priority: "medium",
    category: "transmision"
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const operator = usersData.users.find((user) => user.email === formData.operatorEmail);
      if (!operator) throw new Error("Email de operador no encontrado en el sistema");

      const newReport = {
        id: generateReportId(),
        operatorId: operator.id,
        operatorName: operator.name,
        operatorEmail: operator.email,
        problemDescription: formData.problemDescription,
        dateStarted: formData.dateStarted,
        dateResolved: formData.isResolved ? formData.dateResolved : undefined,
        isResolved: formData.isResolved,
        status: formData.isResolved ? 'resolved' : 'pending',
        priority: formData.priority,
        category: formData.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingReports = localStorage.getItem('enlace-reports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.push(newReport);
      localStorage.setItem('enlace-reports', JSON.stringify(reports));

      setSuccess(true);
      setTimeout(() => router.push('/reports'), 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el reporte");
    } finally {
      setLoading(false);
    }
  };

  const generateReportId = () => `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const glassBg = "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-lg shadow-black/20 rounded-2xl";

  if (success) {
    return (
      _jsx("div", { className: "min-h-screen flex items-center justify-center p-4", style: { background: "hsl(240,10%,3.9%)" }, children:
        _jsx(motion.div, {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          className: `w-full max-w-md ${glassBg} text-white`, children:

          _jsx(Card, { className: "bg-transparent border-0 text-white", children:
            _jsx(CardContent, { className: "pt-8 pb-8", children:
              _jsxs("div", { className: "text-center", children: [
                _jsx(motion.div, {
                  initial: { scale: 0, rotate: -180 },
                  animate: { scale: 1, rotate: 0 },
                  transition: { type: "spring", stiffness: 200, damping: 20 },
                  className: "w-20 h-20 bg-green-500/20 backdrop-blur-3xl rounded-full flex items-center justify-center mx-auto mb-6", children:

                  _jsx(Send, { className: "w-10 h-10 text-green-400" }) }
                ),
                _jsx("h2", { className: "text-3xl font-bold mb-3 tracking-tight", children: "\xA1Reporte Creado!" }

                ),
                _jsx("p", { className: "text-white/60 mb-6 px-4", children: "El reporte ha sido registrado en el sistema exitosamente." }

                ),
                _jsxs("div", { className: "flex items-center justify-center gap-2 text-sm text-white/40", children: [
                  _jsx("div", { className: "w-2 h-2 rounded-full bg-white/40 animate-pulse" }), "Redirigiendo al dashboard..."] }

                )] }
              ) }
            ) }
          ) }
        ) }
      ));

  }

  return (
    _jsx("div", { className: "min-h-screen p-4 md:p-8", style: { background: "hsl(240,10%,3.9%)" }, children:
      _jsxs("div", { className: "max-w-4xl mx-auto space-y-8 text-white", children: [

        _jsxs(motion.div, {
          className: "flex items-center space-x-4",
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.1 }, children: [

          _jsx(Link, { href: "/", children:
            _jsxs(Button, { variant: "outline", size: "sm", className: "border-white/10 text-white hover:bg-white/5 hover:text-white bg-transparent transition-colors", children: [
              _jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Volver"] }

            ) }
          ),
          _jsxs("div", { children: [
            _jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Crear Nuevo Reporte" }

            ),
            _jsx("p", { className: "text-white/60", children: "Registra un problema t\xE9cnico o incidente de transmisi\xF3n" }

            )] }
          )] }
        ),


        _jsx(motion.div, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.2 }, children:

          _jsxs(Card, { className: `${glassBg} text-white`, children: [
            _jsx(CardHeader, { className: "border-b border-white/5 pb-6", children:
              _jsx(CardTitle, { children: "Informaci\xF3n del Reporte" }) }
            ),
            _jsx(CardContent, { className: "pt-8", children:
              _jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [

                _jsx(AnimatePresence, { children:
                  error &&
                  _jsx(motion.div, {
                    initial: { opacity: 0, height: 0 },
                    animate: { opacity: 1, height: "auto" },
                    exit: { opacity: 0, height: 0 }, children:

                    _jsxs(Alert, { className: "border-red-500/20 bg-red-500/10 backdrop-blur-3xl text-red-200 rounded-xl", children: [
                      _jsx(AlertCircle, { className: "h-4 w-4 text-red-400" }),
                      _jsx(AlertDescription, { children: error })] }
                    ) }
                  ) }

                ),

                _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [

                  _jsxs("div", { className: "space-y-2", children: [
                    _jsxs(Label, { htmlFor: "operatorEmail", className: "text-white/80 font-medium", children: ["Email del Operador ", _jsx("span", { className: "text-red-400", children: "*" })] }),
                    _jsxs(Select, {
                      value: formData.operatorEmail,
                      onValueChange: (value) => handleInputChange('operatorEmail', value), children: [

                      _jsx(SelectTrigger, { className: "bg-white/5 border-white/10 text-white placeholder-white/20 h-12 rounded-xl focus:ring-2 focus:ring-white/10 focus:ring-offset-0", children:
                        _jsx(SelectValue, { placeholder: "Seleccionar operador" }) }
                      ),
                      _jsx(SelectContent, { className: "bg-[#1a1a1a] border-white/10 text-white max-h-[300px]", children:
                        usersData.users.map((user) =>
                        _jsxs(SelectItem, { value: user.email, className: "focus:bg-white/10 focus:text-white cursor-pointer", children: [user.name, " (", user.email, ")"] }, user.id)
                        ) }
                      )] }
                    )] }
                  ),


                  _jsxs("div", { className: "space-y-2", children: [
                    _jsxs(Label, { htmlFor: "priority", className: "text-white/80 font-medium", children: [" Canal ", _jsx("span", { className: "text-red-400", children: "*" })] }),
                    _jsxs(Select, {
                      value: formData.priority,
                      onValueChange: (value) => handleInputChange('priority', value), children: [

                      _jsx(SelectTrigger, { className: "bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-2 focus:ring-white/10 focus:ring-offset-0", children:
                        _jsx(SelectValue, {}) }
                      ),
                      _jsxs(SelectContent, { className: "bg-[#1a1a1a] border-white/10 text-white", children: [
                        _jsx(SelectItem, { value: "Enlace", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Enlace" }),
                        _jsx(SelectItem, { value: "EJTV", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "EJTV" }),
                        _jsx(SelectItem, { value: "Enlace USA", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "EnlaceUSA" }),
                        _jsx(SelectItem, { value: "Todos", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Todos (Enlace USA, Enlace, EJTV y EnlaceCR)" })] }
                      )] }
                    )] }
                  ),


                  _jsxs("div", { className: "space-y-2", children: [
                    _jsxs(Label, { htmlFor: "category", className: "text-white/80 font-medium", children: ["Categor\xEDa ", _jsx("span", { className: "text-red-400", children: "*" })] }),
                    _jsxs(Select, {
                      value: formData.category,
                      onValueChange: (value) => handleInputChange('category', value), children: [

                      _jsx(SelectTrigger, { className: "bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-2 focus:ring-white/10 focus:ring-offset-0", children:
                        _jsx(SelectValue, {}) }
                      ),
                      _jsxs(SelectContent, { className: "bg-[#1a1a1a] border-white/10 text-white", children: [
                        _jsx(SelectItem, { value: "transmision", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Transmisi\xF3n" }),
                        _jsx(SelectItem, { value: "audio", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Audio" }),
                        _jsx(SelectItem, { value: "video", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Video" }),
                        _jsx(SelectItem, { value: "equipos", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Equipos" }),
                        _jsx(SelectItem, { value: "software", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Software" }),
                        _jsx(SelectItem, { value: "Channel Box", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Channel Box" }),
                        _jsx(SelectItem, { value: "Bitcentral", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Ca\xEDda de Servidores Bitcentral" }),
                        _jsx(SelectItem, { value: "Falla Energ\xE9tica", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Falla Energ\xE9tica" }),
                        _jsx(SelectItem, { value: "otros", className: "focus:bg-white/10 focus:text-white cursor-pointer", children: "Otros" })] }
                      )] }
                    )] }
                  ),


                  _jsxs("div", { className: "space-y-2", children: [
                    _jsxs(Label, { htmlFor: "dateStarted", className: "text-white/80 font-medium", children: ["Fecha del Problema ", _jsx("span", { className: "text-red-400", children: "*" })] }),
                    _jsx(Input, {
                      id: "dateStarted",
                      type: "datetime-local",
                      value: formData.dateStarted,
                      onChange: (e) => handleInputChange('dateStarted', e.target.value),
                      required: true,
                      className: "bg-white/5 border-white/10 text-white placeholder-white/20 h-12 rounded-xl focus:ring-2 focus:ring-white/10 focus:border-transparent invert-calendar-icon",
                      style: { colorScheme: "dark" } }
                    )] }
                  )] }
                ),


                _jsxs("div", { className: "space-y-2", children: [
                  _jsxs(Label, { htmlFor: "problemDescription", className: "text-white/80 font-medium", children: ["Descripci\xF3n del Problema ", _jsx("span", { className: "text-red-400", children: "*" })] }),
                  _jsx(Textarea, {
                    id: "problemDescription",
                    placeholder: "Describe detalladamente el problema encontrado...",
                    value: formData.problemDescription,
                    onChange: (e) => handleInputChange('problemDescription', e.target.value),
                    required: true,
                    rows: 4,
                    className: "bg-white/5 border-white/10 text-white placeholder-white/20 rounded-xl focus:ring-2 focus:ring-white/10 focus:border-transparent resize-none leading-relaxed" }
                  )] }
                ),


                _jsxs("div", { className: "space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10", children: [
                  _jsxs("div", { className: "flex items-center space-x-3", children: [
                    _jsx("input", {
                      type: "checkbox",
                      id: "isResolved",
                      checked: formData.isResolved,
                      onChange: (e) => handleInputChange('isResolved', e.target.checked),
                      className: "w-5 h-5 accent-emerald-500 rounded focus:ring-offset-0 focus:ring-emerald-500 cursor-pointer" }
                    ),
                    _jsx(Label, { htmlFor: "isResolved", className: "text-white font-medium cursor-pointer select-none", children: "\xBFEl problema ha sido resuelto?" }

                    )] }
                  ),

                  _jsx(AnimatePresence, { children:
                    formData.isResolved &&
                    _jsx(motion.div, {
                      initial: { opacity: 0, height: 0 },
                      animate: { opacity: 1, height: "auto" },
                      exit: { opacity: 0, height: 0 },
                      className: "overflow-hidden", children:

                      _jsxs("div", { className: "space-y-2 pt-2", children: [
                        _jsxs(Label, { htmlFor: "dateResolved", className: "text-white/80 font-medium", children: ["Fecha de Resoluci\xF3n ", _jsx("span", { className: "text-red-400", children: "*" })] }),
                        _jsx(Input, {
                          id: "dateResolved",
                          type: "datetime-local",
                          value: formData.dateResolved,
                          onChange: (e) => handleInputChange('dateResolved', e.target.value),
                          required: formData.isResolved,
                          className: "bg-black/20 border-white/10 text-white h-12 rounded-xl focus:ring-emerald-500/30 focus:border-emerald-500/50",
                          style: { colorScheme: "dark" } }
                        )] }
                      ) }
                    ) }

                  )] }
                ),


                _jsxs("div", { className: "flex justify-end space-x-4 pt-4", children: [
                  _jsx(Link, { href: "/", children:
                    _jsx(Button, { variant: "outline", disabled: loading, className: "border-white/10 text-white hover:bg-white/5 hover:text-white bg-transparent h-12 px-6 rounded-xl transition-all", children: "Cancelar" }

                    ) }
                  ),
                  _jsx(Button, {
                    type: "submit",
                    className: "bg-white text-black hover:bg-white/90 h-12 px-8 rounded-xl font-semibold shadow-lg shadow-white/5 hover:shadow-white/10 hover:scale-[1.02] transition-all",
                    disabled: loading, children:

                    loading ?
                    _jsxs(_Fragment, { children: [
                      _jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-black/30 border-t-black mr-2" }), "Creando..."] }

                    ) :

                    _jsxs(_Fragment, { children: [
                      _jsx(Send, { className: "w-4 h-4 mr-2" }), "Crear Reporte"] }

                    ) }

                  )] }
                )] }

              ) }
            )] }
          ) }
        )] }
      ) }
    ));

}