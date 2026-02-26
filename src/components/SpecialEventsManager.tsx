"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Trash2, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SpecialEventsManager() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [eventShifts, setEventShifts] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/special-events');
      if (res.ok) setEvents(await res.json());
    } catch (e) {console.error(e);}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {console.error(e);}
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.startDate || !newEvent.endDate) return;
    try {
      const res = await fetch('/api/special-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        setNewEvent({ name: '', startDate: '', endDate: '' });
        setIsCreating(false);
        fetchEvents();
      }
    } catch (e) {console.error(e);}
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("¿Eliminar evento? Se perderán los horarios configurados.")) return;
    try {
      await fetch(`/api/special-events?id=${id}`, { method: 'DELETE' });
      fetchEvents();
    } catch (e) {console.error(e);}
  };

  const handleToggleActive = async (event) => {
    try {
      await fetch('/api/special-events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id, isActive: !event.isActive })
      });
      fetchEvents();
    } catch (e) {console.error(e);}
  };


  const [viewedWeekStart, setViewedWeekStart] = useState('');

  const openEventSchedule = async (event) => {
    setViewingEvent(event);


    const dateRaw = event.startDate;
    const start = new Date(dateRaw.includes('T') ? dateRaw : dateRaw + 'T12:00:00');

    if (isNaN(start.getTime())) {
      console.error("Invalid start date for event:", dateRaw);
      setViewedWeekStart('');
      return;
    }

    const dayIdx = start.getDay();
    if (dayIdx !== 0) {
      start.setDate(start.getDate() - dayIdx);
    }
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    setViewedWeekStart(`${y}-${m}-${d}`);


    try {
      const res = await fetch(`/api/special-events/shifts?eventId=${event.id}`);
      if (res.ok) {
        const data = await res.json();


        const map = {};
        data.forEach((s) => {
          if (!map[s.userId]) map[s.userId] = [];






          map[s.userId].push({ days: [], date: s.date, start: s.start, end: s.end });
        });
        setEventShifts(map);
      }
    } catch (e) {console.error(e);}
  };

  const handleUpdateEventSchedule = async (userId, newShifts) => {
    if (!viewedWeekStart) return;
    const parseSafe = (dStr) => new Date(dStr.includes('T') ? dStr : dStr + 'T12:00:00');
    const toISO = (d) => isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];

    const eventSpecificShifts = newShifts.map((s) => {
      const dateMap = s.days.map((dayIdx) => {
        const date = parseSafe(viewedWeekStart);
        if (isNaN(date.getTime())) return '';
        date.setDate(date.getDate() + dayIdx);
        return toISO(date);
      }).filter((d) => d !== '');
      return { ...s, specificDates: dateMap };
    });



    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = parseSafe(viewedWeekStart);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + i);
      return toISO(d);
    }).filter((d) => d !== '');

    setEventShifts((prev) => {
      const existing = prev[userId] || [];

      const otherWeeks = existing.filter((s) => !weekDates.includes(s.date));


      const newExploded = [];
      eventSpecificShifts.forEach((s) => {
        s.specificDates.forEach((d) => {
          newExploded.push({ date: d, start: s.start, end: s.end, days: [] });
        });
      });

      return { ...prev, [userId]: [...otherWeeks, ...newExploded] };
    });
    setEventShifts((current) => {
      const userShifts = current[userId] || [];

      const flatShifts = userShifts.map((s) => ({
        date: s.date,
        start: s.start,
        end: s.end
      }));

      fetch('/api/special-events/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: viewingEvent?.id,
          userId,
          shifts: flatShifts
        })
      }).catch((e) => console.error(e));

      return current;
    });
  };



  const eventOperators = users.map((u) => {
    const userShifts = eventShifts[u.id] || [];


    const weekShifts = [];

    if (viewedWeekStart) {
      const parseSafe = (dStr) => new Date(dStr.includes('T') ? dStr : dStr + 'T12:00:00');
      const toISO = (d) => isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];


      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = parseSafe(viewedWeekStart);
        if (isNaN(d.getTime())) return '';
        d.setDate(d.getDate() + i);
        return toISO(d);
      }).filter((d) => d !== '');

      userShifts.forEach((s) => {
        const dayIdx = weekDates.indexOf(s.date);
        if (dayIdx !== -1) {

          const existing = weekShifts.find((ws) => ws.start === s.start && ws.end === s.end);
          if (existing) {
            if (!existing.days.includes(dayIdx)) existing.days.push(dayIdx);
          } else {
            weekShifts.push({ days: [dayIdx], start: s.start, end: s.end });
          }
        }
      });
    }

    return {
      id: u.id,
      name: u.name,
      image: u.image,
      shifts: weekShifts,
      isTempSchedule: true
    };
  });

  if (viewingEvent) {
    return (
      _jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-right-4 duration-300", children: [
        _jsx("div", { className: "flex items-center justify-between mb-4", children:
          _jsxs("div", { className: "flex items-center gap-4", children: [
            _jsxs(Button, { variant: "ghost", onClick: () => setViewingEvent(null), className: "text-slate-400 hover:text-white", children: [
              _jsx(ArrowRight, { className: "w-5 h-5 rotate-180 mr-2" }), " Volver"] }
            ),
            _jsxs("div", { children: [
              _jsxs("h2", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [
                _jsx(CalendarDays, { className: "w-6 h-6 text-[#FF0C60]" }),
                viewingEvent.name] }
              ),
              _jsxs("p", { className: "text-slate-400 text-sm", children: ["Configurando fechas (",
                viewingEvent.startDate, " - ", viewingEvent.endDate, ")"] }
              )] }
            )] }
          ) }
        ),

        _jsx(WeeklyCalendar, {
          operators: eventOperators,
          currentWeekStart: viewedWeekStart,
          onUpdateSchedule: handleUpdateEventSchedule,
          onWeekChange: setViewedWeekStart }
        )] }
      ));

  }

  return (
    _jsxs("div", { className: "space-y-6 animate-in fade-in duration-500", children: [
      _jsxs("div", { className: "flex justify-between items-end", children: [
        _jsxs("div", { children: [
          _jsx("h2", { className: "text-xl font-bold text-white", children: "Eventos Especiales" }),
          _jsx("p", { className: "text-slate-400", children: "Crea horarios temporales para marat\xF3nicas o fechas especiales." })] }
        ),
        _jsxs(Button, { onClick: () => setIsCreating(true), className: "bg-[#FF0C60] hover:bg-[#d90a50] text-white", children: [
          _jsx(Plus, { className: "w-4 h-4 mr-2" }), " Nuevo Evento"] }
        )] }
      ),

      isCreating &&
      _jsxs(Card, { className: "bg-white border border-slate-200 mb-6 rounded-md shadow-none ring-1 ring-slate-100", children: [
        _jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg text-slate-800", children: "Crear Evento" }) }),
        _jsxs(CardContent, { className: "space-y-4", children: [
          _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
            _jsxs("div", { className: "space-y-2", children: [
              _jsx(Label, { children: "Nombre del Evento" }),
              _jsx(Input, {
                value: newEvent.name, onChange: (e) => setNewEvent({ ...newEvent, name: e.target.value }),
                placeholder: "Ej. Marat\xF3nica Marzo",
                className: "bg-slate-50 border-slate-200 text-slate-700" }
              )] }
            ),
            _jsxs("div", { className: "space-y-2", children: [
              _jsx(Label, { children: "Fecha Inicio" }),
              _jsx(Input, {
                type: "date",
                value: newEvent.startDate, onChange: (e) => setNewEvent({ ...newEvent, startDate: e.target.value }),
                className: "bg-slate-50 border-slate-200 text-slate-700" }
              )] }
            ),
            _jsxs("div", { className: "space-y-2", children: [
              _jsx(Label, { children: "Fecha Fin" }),
              _jsx(Input, {
                type: "date",
                value: newEvent.endDate, onChange: (e) => setNewEvent({ ...newEvent, endDate: e.target.value }),
                className: "bg-slate-50 border-slate-200 text-slate-700" }
              )] }
            )] }
          ),
          _jsxs("div", { className: "flex justify-end gap-2", children: [
            _jsx(Button, { variant: "ghost", onClick: () => setIsCreating(false), children: "Cancelar" }),
            _jsx(Button, { onClick: handleCreateEvent, className: "bg-emerald-600 hover:bg-emerald-700", children: "Guardar" })] }
          )] }
        )] }
      ),


      _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children:
        events.map((event) =>
        _jsxs(Card, { className: "bg-white border border-slate-200 hover:border-[#FF0C60]/30 transition-all group relative overflow-hidden shadow-none rounded-md", children: [
          _jsx("div", { className: `absolute top-0 left-0 w-1 h-full ${event.isActive ? 'bg-[#FF0C60]' : 'bg-slate-700'}` }),
          _jsxs(CardHeader, { className: "pb-2", children: [
            _jsxs("div", { className: "flex justify-between items-start", children: [
              _jsx(Badge, { variant: "outline", className: `${event.isActive ? 'text-[#FF0C60] border-[#FF0C60]/30 bg-[#FF0C60]/5' : 'text-slate-400 border-slate-200'}`, children:
                event.isActive ? 'Activo' : 'Inactivo' }
              ),
              _jsxs("div", { className: "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
                _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleToggleActive(event), className: "h-8 w-8 hover:bg-slate-100", title: event.isActive ? "Desactivar" : "Activar", children:
                  _jsx(CalendarIcon, { className: "w-4 h-4 text-slate-400" }) }
                ),
                _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleDeleteEvent(event.id), className: "h-8 w-8 text-rose-500 hover:bg-rose-50", children:
                  _jsx(Trash2, { className: "w-4 h-4" }) }
                )] }
              )] }
            ),
            _jsx(CardTitle, { className: "text-xl mt-2 text-slate-800", children: event.name }),
            _jsxs(CardDescription, { className: "flex items-center gap-2", children: [
              event.startDate, " ", _jsx(ArrowRight, { className: "w-3 h-3" }), " ", event.endDate] }
            )] }
          ),
          _jsx(CardContent, { children:
            _jsxs("div", { className: "flex justify-between items-center mt-4", children: [
              _jsxs("div", { className: "text-sm text-slate-500", children: [
                event._count?.shifts || 0, " turnos asignados"] }
              ),
              _jsx(Button, { onClick: () => openEventSchedule(event), className: "bg-slate-50 hover:bg-[#FF0C60] text-slate-600 hover:text-white border border-slate-200 hover:border-[#FF0C60] rounded-md", children: "Gestionar Horarios" }

              )] }
            ) }
          )] }, event.id
        )
        ) }
      )] }
    ));

}