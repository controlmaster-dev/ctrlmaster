"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function DateTimePicker({ date, setDate, disabled }) {
  const [selectedTime, setSelectedTime] = React.useState("00:00");


  React.useEffect(() => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setSelectedTime(`${hours}:${minutes}`);
    }
  }, [date]);

  const handleDateSelect = (newDate) => {
    if (newDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    }
  };


  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const hour = i.toString().padStart(2, '0');
        const minute = j.toString().padStart(2, '0');
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  }, []);

  return (
    _jsxs(Popover, { children: [
      _jsx(PopoverTrigger, { asChild: true, children:
        _jsxs(Button, {
          variant: "outline",
          className: cn(
            "w-full justify-start text-left font-normal bg-white h-12 rounded-xl border-white/20 text-gray-900 shadow-sm hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900",
            !date && "text-muted-foreground"
          ),
          disabled: disabled, children: [

          _jsx(CalendarIcon, { className: "mr-2 h-4 w-4 opacity-50" }),
          date ? format(date, "PPP p", { locale: es }) : _jsx("span", { children: "Seleccionar fecha y hora" })] }
        ) }
      ),
      _jsxs(PopoverContent, { className: "w-auto p-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10", align: "start", children: [
        _jsx("div", { className: "p-3 border-b border-white/10", children:
          _jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            _jsx(Clock, { className: "w-4 h-4 text-white/50" }),
            _jsxs(Select, { value: selectedTime, onValueChange: handleTimeChange, children: [
              _jsx(SelectTrigger, { className: "w-[180px] h-8 bg-white/5 border-white/10 text-white", children:
                _jsx(SelectValue, { placeholder: "Seleccionar hora" }) }
              ),
              _jsx(SelectContent, { className: "bg-[#1a1a1a] border-white/10 text-white max-h-[200px]", children:
                timeOptions.map((time) =>
                _jsx(SelectItem, { value: time, className: "focus:bg-white/10 focus:text-white cursor-pointer", children:
                  time }, time
                )
                ) }
              )] }
            )] }
          ) }
        ),
        _jsx(Calendar, {
          mode: "single",
          selected: date,
          onSelect: handleDateSelect,
          initialFocus: true,
          locale: es }
        )] }
      )] }
    ));

}