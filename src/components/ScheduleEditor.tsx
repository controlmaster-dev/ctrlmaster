"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const DAYS = [
  { id: 1, label: 'L', full: 'Lunes' },
  { id: 2, label: 'M', full: 'Martes' },
  { id: 3, label: 'M', full: 'Miércoles' },
  { id: 4, label: 'J', full: 'Jueves' },
  { id: 5, label: 'V', full: 'Viernes' },
  { id: 6, label: 'S', full: 'Sábado' },
  { id: 0, label: 'D', full: 'Domingo' }];


export function ScheduleEditor({ value, onChange }) {
  const [shifts, setShifts] = useState(value || []);


  useEffect(() => {
    if (value) setShifts(value);
  }, [value]);

  const updateShift = (index: number, field: string, val: number | number[]) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: val };
    setShifts(newShifts);
    onChange(newShifts);
  };

  const toggleDay = (shiftIndex, dayId) => {
    const shift = shifts[shiftIndex];
    const newDays = shift.days.includes(dayId) ?
      shift.days.filter((d) => d !== dayId) :
      [...shift.days, dayId];
    updateShift(shiftIndex, 'days', newDays);
  };

  const addShift = () => {
    const newShift = { days: [1, 2, 3, 4, 5], start: 8, end: 17 };
    const newShifts = [...shifts, newShift];
    setShifts(newShifts);
    onChange(newShifts);
  };

  const removeShift = (index) => {
    const newShifts = shifts.filter((_, i) => i !== index);
    setShifts(newShifts);
    onChange(newShifts);
  };

  const formatHour = (h) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:00 ${ampm}`;
  };


  const hours = Array.from({ length: 25 }, (_, i) => ({ value: i, label: formatHour(i) }));

  return (
    _jsxs("div", {
      className: "space-y-6", children: [
        _jsxs("div", {
          className: "flex justify-between items-center px-1", children: [
            _jsxs("div", {
              className: "flex flex-col", children: [
                _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground tracking-widest uppercase opacity-70", children: "Turnos de Trabajo" }),
                _jsx("p", { className: "text-[10px] text-muted-foreground/50 font-medium", children: "Define los periodos de actividad semanal" })]
            }
            ),
            _jsxs(Button, {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: addShift,
              className: "h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-border text-foreground hover:bg-[#FF0C60] hover:border-[#FF0C60] hover:text-white transition-all rounded-lg group shadow-sm active:scale-95", children: [

                _jsx(Plus, { className: "w-3.5 h-3.5 mr-2 group-hover:rotate-90 transition-transform" }), "A\xD1ADIR TURNO"]
            }

            )]
        }
        ),

        shifts.length === 0 &&
        _jsx(motion.div, {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          className: "text-[11px] text-muted-foreground font-semibold uppercase tracking-widest text-center py-10 border-2 border-dashed border-border rounded-2xl bg-muted/20", children:
            "SISTEMA SIN HORARIO ASIGNADO"
        }

        ),


        _jsx("div", {
          className: "grid gap-4", children:
            _jsx(AnimatePresence, {
              mode: "popLayout", children:
                shifts.map((shift, index) =>
                  _jsxs(motion.div, {

                    layout: true,
                    initial: { opacity: 0, x: -20, scale: 0.95 },
                    animate: { opacity: 1, x: 0, scale: 1 },
                    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
                    className: "bg-card border border-border rounded-2xl p-6 space-y-5 relative group hover:border-[#FF0C60]/30 hover:shadow-md transition-all shadow-sm", children: [

                      _jsx(Button, {
                        type: "button",
                        variant: "ghost",
                        size: "icon",
                        onClick: () => removeShift(index),
                        className: "absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg", children:

                          _jsx(X, { className: "w-4 h-4" })
                      }
                      ),

                      _jsxs("div", {
                        className: "flex items-center gap-3", children: [
                          _jsx("div", {
                            className: "w-8 h-8 bg-[#FF0C60]/10 rounded-lg flex items-center justify-center border border-[#FF0C60]/20", children:
                              _jsx(Clock, { className: "w-4 h-4 text-[#FF0C60]" })
                          }
                          ),
                          _jsx("h5", { className: "text-[10px] font-semibold text-foreground uppercase tracking-[0.2em]", children: "Configuraci\xF3n del Turno" })]
                      }
                      ),

                      _jsxs("div", {
                        className: "grid gap-6", children: [

                          _jsxs("div", {
                            className: "space-y-3", children: [
                              _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1 opacity-50", children: "D\xEDas de actividad" }),
                              _jsx("div", {
                                className: "flex gap-2 flex-wrap", children:
                                  DAYS.map((day) => {
                                    const isActive = shift.days.includes(day.id);
                                    return (
                                      _jsx("button", {

                                        type: "button",
                                        onClick: () => toggleDay(index, day.id),
                                        className: `h-10 px-4 rounded-xl text-xs font-semibold transition-all border ${isActive ?
                                          'bg-[#FF0C60] text-white border-[#FF0C60] shadow-[0_5px_15px_-5px_rgba(255,12,96,0.4)] scale-105 z-10' :
                                          'bg-muted/30 text-muted-foreground border-border hover:border-foreground/20 hover:bg-muted'}`,

                                        title: day.full, children:

                                          day.full.substring(0, 3).toUpperCase()
                                      }, day.id
                                      ));

                                  })
                              }
                              )]
                          }
                          ),

                          _jsx("div", { className: "h-px bg-border w-full" }),


                          _jsxs("div", {
                            className: "flex items-center gap-8", children: [
                              _jsxs("div", {
                                className: "flex-1 space-y-3", children: [
                                  _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1 opacity-70", children: "Hora de Inicio" }),
                                  _jsxs(Select, {
                                    value: String(shift.start), onValueChange: (v) => updateShift(index, 'start', parseInt(v)), children: [
                                      _jsx(SelectTrigger, {
                                        className: "h-12 bg-background border-input text-foreground font-semibold ring-offset-background focus:ring-1 focus:ring-[#FF0C60]/30 rounded-xl", children:
                                          _jsx(SelectValue, {})
                                      }
                                      ),
                                      _jsx(SelectContent, {
                                        className: "bg-popover border-border text-popover-foreground", children:
                                          hours.slice(0, 24).map((h) =>
                                            _jsx(SelectItem, { value: String(h.value), className: "focus:bg-[#FF0C60] focus:text-white hover:bg-muted", children: h.label }, h.value)
                                          )
                                      }
                                      )]
                                  }
                                  )]
                              }
                              ),

                              _jsx("div", {
                                className: "mt-8", children:
                                  _jsx("div", { className: "w-6 h-0.5 bg-border rounded-full" })
                              }
                              ),

                              _jsxs("div", {
                                className: "flex-1 space-y-3", children: [
                                  _jsx(Label, { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1 opacity-70", children: "Hora de Cierre" }),
                                  _jsxs(Select, {
                                    value: String(shift.end), onValueChange: (v) => updateShift(index, 'end', parseInt(v)), children: [
                                      _jsx(SelectTrigger, {
                                        className: "h-12 bg-background border-input text-foreground font-semibold ring-offset-background focus:ring-1 focus:ring-[#FF0C60]/30 rounded-xl", children:
                                          _jsx(SelectValue, {})
                                      }
                                      ),
                                      _jsx(SelectContent, {
                                        className: "bg-popover border-border text-popover-foreground", children:
                                          hours.map((h) =>
                                            _jsx(SelectItem, { value: String(h.value), className: "focus:bg-[#FF0C60] focus:text-white hover:bg-muted", children: h.label }, h.value)
                                          )
                                      }
                                      )]
                                  }
                                  )]
                              }
                              )]
                          }
                          )]
                      }
                      )]
                  }, index
                  )
                )
            }
            )
        }
        )]
    }
    ));

}