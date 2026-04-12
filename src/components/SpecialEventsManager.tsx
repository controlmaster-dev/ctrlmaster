"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Plus,
  Trash2,
  ArrowRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";

export function SpecialEventsManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [viewingEvent, setViewingEvent] = useState<any>(null);
  const [eventShifts, setEventShifts] = useState<Record<string, any[]>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/special-events");
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.startDate || !newEvent.endDate) return;
    try {
      const res = await fetch("/api/special-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        setNewEvent({ name: "", startDate: "", endDate: "" });
        setIsCreating(false);
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("¿Eliminar evento? Se perderán los horarios configurados."))
      return;
    try {
      await fetch(`/api/special-events?id=${id}`, { method: "DELETE" });
      fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (event: any) => {
    try {
      await fetch("/api/special-events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, isActive: !event.isActive }),
      });
      fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const [viewedWeekStart, setViewedWeekStart] = useState("");

  const openEventSchedule = async (event: any) => {
    setViewingEvent(event);

    const dateRaw = event.startDate;
    const start = new Date(
      dateRaw.includes("T") ? dateRaw : dateRaw + "T12:00:00"
    );

    if (isNaN(start.getTime())) {
      console.error("Invalid start date for event:", dateRaw);
      setViewedWeekStart("");
      return;
    }

    const dayIdx = start.getDay();
    if (dayIdx !== 0) {
      start.setDate(start.getDate() - dayIdx);
    }
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const d = String(start.getDate()).padStart(2, "0");
    setViewedWeekStart(`${y}-${m}-${d}`);

    try {
      const res = await fetch(`/api/special-events/shifts?eventId=${event.id}`);
      if (res.ok) {
        const data = await res.json();

        const map: Record<string, any[]> = {};
        data.forEach((s: any) => {
          if (!map[s.userId]) map[s.userId] = [];
          map[s.userId].push({
            days: [],
            date: s.date,
            start: s.start,
            end: s.end,
          });
        });
        setEventShifts(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateEventSchedule = async (userId: string, newShifts: any[]) => {
    if (!viewedWeekStart) return;
    const parseSafe = (dStr: string) =>
      new Date(dStr.includes("T") ? dStr : dStr + "T12:00:00");
    const toISO = (d: Date) =>
      isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];

    const eventSpecificShifts = newShifts.map((s) => {
      const dateMap = s.days
        .map((dayIdx: number) => {
          const date = parseSafe(viewedWeekStart);
          if (isNaN(date.getTime())) return "";
          date.setDate(date.getDate() + dayIdx);
          return toISO(date);
        })
        .filter((d: string) => d !== "");
      return { ...s, specificDates: dateMap };
    });

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = parseSafe(viewedWeekStart);
      if (isNaN(d.getTime())) return "";
      d.setDate(d.getDate() + i);
      return toISO(d);
    }).filter((d) => d !== "");

    setEventShifts((prev) => {
      const existing = prev[userId] || [];
      const otherWeeks = existing.filter((s) => !weekDates.includes(s.date));

      const newExploded: any[] = [];
      eventSpecificShifts.forEach((s) => {
        s.specificDates.forEach((d: string) => {
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
        end: s.end,
      }));

      fetch("/api/special-events/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: viewingEvent?.id,
          userId,
          shifts: flatShifts,
        }),
      }).catch((e) => console.error(e));

      return current;
    });
  };

  const eventOperators = users.map((u) => {
    const userShifts = eventShifts[u.id] || [];
    const weekShifts: any[] = [];

    if (viewedWeekStart) {
      const parseSafe = (dStr: string) =>
        new Date(dStr.includes("T") ? dStr : dStr + "T12:00:00");
      const toISO = (d: Date) =>
        isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];

      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = parseSafe(viewedWeekStart);
        if (isNaN(d.getTime())) return "";
        d.setDate(d.getDate() + i);
        return toISO(d);
      }).filter((d) => d !== "");

      userShifts.forEach((s) => {
        const dayIdx = weekDates.indexOf(s.date);
        if (dayIdx !== -1) {
          const existing = weekShifts.find(
            (ws) => ws.start === s.start && ws.end === s.end
          );
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
      email: u.email || "",
      image: u.image,
      role: u.role || "OPERATOR",
      shifts: weekShifts,
      isTempSchedule: true,
    };
  });

  if (viewingEvent) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setViewingEvent(null)}
              className="text-slate-400 hover:text-white"
            >
              <ArrowRight className="w-5 h-5 rotate-180 mr-2" /> Volver
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-[#FF0C60]" />
                {viewingEvent.name}
              </h2>
              <p className="text-slate-400 text-sm">
                Configurando fechas ({viewingEvent.startDate} -{" "}
                {viewingEvent.endDate})
              </p>
            </div>
          </div>
        </div>

        <WeeklyCalendar
          operators={eventOperators}
          currentWeekStart={viewedWeekStart}
          onUpdateSchedule={handleUpdateEventSchedule}
          onWeekChange={setViewedWeekStart}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white">Eventos Especiales</h2>
          <p className="text-slate-400">
            Crea horarios temporales para maratónicas o fechas especiales.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#FF0C60] hover:bg-[#d90a50] text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Evento
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-white border border-slate-200 mb-6 rounded-md shadow-none ring-1 ring-slate-100">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">
              Crear Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Evento</Label>
                <Input
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, name: e.target.value })
                  }
                  placeholder="Ej. Maratónica Marzo"
                  className="bg-slate-50 border-slate-200 text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={newEvent.startDate}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, startDate: e.target.value })
                  }
                  className="bg-slate-50 border-slate-200 text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={newEvent.endDate}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, endDate: e.target.value })
                  }
                  className="bg-slate-50 border-slate-200 text-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateEvent}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card
            key={event.id}
            className="bg-white border border-slate-200 hover:border-[#FF0C60]/30 transition-all group relative overflow-hidden shadow-none rounded-md"
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full ${
                event.isActive ? "bg-[#FF0C60]" : "bg-slate-700"
              }`}
            />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge
                  variant="outline"
                  className={`${
                    event.isActive
                      ? "text-[#FF0C60] border-[#FF0C60]/30 bg-[#FF0C60]/5"
                      : "text-slate-400 border-slate-200"
                  }`}
                >
                  {event.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(event)}
                    className="h-8 w-8 hover:bg-slate-100"
                    title={event.isActive ? "Desactivar" : "Activar"}
                  >
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl mt-2 text-slate-800">
                {event.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                {event.startDate} <ArrowRight className="w-3 h-3" />{" "}
                {event.endDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-slate-500">
                  {event._count?.shifts || 0} turnos asignados
                </div>
                <Button
                  onClick={() => openEventSchedule(event)}
                  className="bg-slate-50 hover:bg-[#FF0C60] text-slate-600 hover:text-white border border-slate-200 hover:border-[#FF0C60] rounded-md"
                >
                  Gestionar Horarios
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}