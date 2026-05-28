"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Cake } from "lucide-react";
import { BentoCard } from "@/components/dashboard/BentoCard";
import type { User } from "@/types/auth";

function getInitials(name: string) {
  const names = name.split(" ").filter(Boolean);
  if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatName(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
  return name;
}

export function BirthdayWidget({ users, className }: { users: User[]; className?: string }) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const upcomingBirthdays = users
    .filter((u) => u.birthday)
    .map((u) => {
      const [m, day] = (u.birthday as string).split("-").map(Number);
      let diff = m * 31 + day - (currentMonth * 31 + currentDay);
      if (diff < 0) diff += 365 * 31;
      return { ...u, diff, month: m, day };
    })
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 6);

  return (
    <BentoCard variant="default" className={cn("overflow-hidden", className)}>
      <div className="p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/40 text-muted-foreground">
            <Cake className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-none text-foreground">Cumpleaños</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Próximas fechas</p>
          </div>
        </div>

        {upcomingBirthdays.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No hay fechas próximas.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {upcomingBirthdays.map((user) => {
              const isToday = user.diff === 0;
              const monthLabel = new Date(2000, user.month - 1, 1)
                .toLocaleString("es-CR", { month: "short" })
                .replace(".", "");

              return (
                <li key={user.id}>
                  <div
                    className={`flex flex-col items-center rounded-lg border px-2 py-2.5 text-center transition-colors ${
                      isToday
                        ? "border-[#FF0C60]/25 bg-muted/40"
                        : "border-border/40 bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-background text-[11px] font-semibold text-muted-foreground">
                      {getInitials(user.name)}
                    </div>
                    <p className="w-full truncate text-[11px] font-medium leading-tight text-foreground">
                      {formatName(user.name)}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                      {isToday ? (
                        <span className="font-medium text-foreground">Hoy</span>
                      ) : (
                        `${user.day} ${monthLabel}`
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BentoCard>
  );
}
