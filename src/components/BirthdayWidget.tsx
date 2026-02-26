"use client";
import { Cake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export function BirthdayWidget({ users }) {
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentDay = today.getDate().toString().padStart(2, '0');


  const parseDate = (d) => {
    if (!d) return { month: 99, day: 99 };
    const [m, day] = d.split('-').map(Number);
    return { month: m, day };
  };


  const upcomingBirthdays = users.filter((u) => u.birthday).map((u) => {
    const { month, day } = parseDate(u.birthday);
    let diff = month * 31 + day - (parseInt(currentMonth) * 31 + parseInt(currentDay));
    if (diff < 0) diff += 365 * 31;
    return { ...u, diff, month, day };
  }).sort((a, b) => a.diff - b.diff);


  const colorPalette = [
  'bg-[#E91E63]',
  'bg-[#9C27B0]',
  'bg-[#3F51B5]',
  'bg-[#00BCD4]',
  'bg-[#4CAF50]',
  'bg-[#FF9800]',
  'bg-[#F44336]'];


  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  const getInitials = (name) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatName = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return name;
  };

  return (
    _jsxs(Card, { className: "bg-card border border-border shadow-sm rounded-xl flex flex-col group transition-all duration-300 overflow-hidden h-[200px]", children: [

      _jsxs("div", { className: "p-4 border-b border-border bg-gradient-to-br from-[#FF0C60]/10 to-transparent flex items-center gap-3 shrink-0", children: [
        _jsx("div", { className: "w-8 h-8 rounded-full bg-[#FF0C60] flex items-center justify-center shadow-[0_4px_15px_rgba(255,12,96,0.4)] shrink-0", children:
          _jsx(Cake, { className: "w-4 h-4 text-white" }) }
        ),
        _jsxs("div", { children: [
          _jsx("h3", { className: "text-[15px] font-bold tracking-tight text-foreground leading-none", children: "Cumplea\xF1os" }),
          _jsx("p", { className: "text-[10px] text-muted-foreground font-medium mt-1 tracking-tight", children: "Pr\xF3ximas celebraciones" })] }
        )] }
      ),


      _jsx(CardContent, { className: "p-0 flex flex-col flex-1 divide-y divide-border/40 overflow-y-auto custom-scrollbar", children:
        upcomingBirthdays.length === 0 ?
        _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 p-6", children: [
          _jsx(Cake, { className: "w-8 h-8 mb-2 opacity-30" }),
          _jsx("span", { className: "text-[12px] font-medium", children: "Sin fechas pr\xF3ximas" })] }
        ) :

        upcomingBirthdays.map((user) => {
          const isToday = user.diff === 0;
          const bgColor = getAvatarColor(user.name);

          return (
            _jsxs("div", { className: "flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors", children: [
              _jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[13px] shadow-sm shrink-0 ${bgColor} ${isToday ? 'ring-4 ring-[#FF0C60]/20' : ''}`, children:
                getInitials(user.name) }
              ),

              _jsxs("div", { className: "flex-1 min-w-0 flex flex-col justify-center", children: [
                _jsx("h4", { className: "text-[13px] font-semibold tracking-tight text-foreground truncate leading-tight", children:
                  formatName(user.name) }
                ),
                _jsx("p", { className: "text-[10px] text-muted-foreground/80 font-medium flex items-center gap-1 mt-0.5 tracking-tight", children:
                  isToday ? _jsx("span", { className: "text-[#FF0C60] font-semibold", children: "\xA1Hoy! \uD83E\uDD73" }) :
                  `${user.day} de ${new Date(2000, user.month - 1, 1).toLocaleString('es-CR', { month: 'long' }).toLowerCase()}` }

                )] }
              )] }, user.id
            ));

        }) }

      )] }
    ));

}