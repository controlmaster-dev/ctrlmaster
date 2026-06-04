"use client";

import { Search, Filter, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BentoCard } from "@/components/dashboard/BentoCard";
import { exportReportsToCSV, type Report } from "@/components/reportes/reportes-types";

type ReportesFiltersBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  operatorFilter: string;
  onOperatorFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  showStats: boolean;
  onToggleStats: () => void;
  hasActiveFilters: boolean;
  uniqueOperators: string[];
  filterChip: (active: boolean) => string;
  onClearFilters: () => void;
  onPageReset: () => void;
  reports: Report[];
};

export function ReportesFiltersBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  operatorFilter,
  onOperatorFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  showFilters,
  onToggleFilters,
  showStats,
  onToggleStats,
  hasActiveFilters,
  uniqueOperators,
  filterChip,
  onClearFilters,
  onPageReset,
  reports,
}: ReportesFiltersBarProps) {
  const resetPage = () => onPageReset();

  return (
    <BentoCard variant="default" className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, operador o descripción…"
            className="h-9 rounded-md border-border bg-muted/20 pl-9 text-sm"
            value={search}
            onChange={(e) => {
              resetPage();
              onSearchChange(e.target.value);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-border bg-muted/15">
            {["all", "Enlace", "EJTV", "Enlace USA"].map((filter, i, arr) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  onPriorityFilterChange(filter);
                  resetPage();
                }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${i < arr.length - 1 ? "border-r border-border" : ""} ${filterChip(priorityFilter === filter)}`}
              >
                {filter === "all" ? "Todos" : filter}
              </button>
            ))}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              onStatusFilterChange(v);
              resetPage();
            }}
          >
            <SelectTrigger className="h-9 w-[140px] rounded-md border-border bg-muted/20 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier estado</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className={`h-9 w-9 rounded-md border-border ${hasActiveFilters ? "bg-muted" : ""}`}
            onClick={onToggleFilters}
            title="Más filtros"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`h-9 w-9 rounded-md border-border ${showStats ? "bg-muted" : ""}`}
            onClick={onToggleStats}
            title="Estadísticas"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md border-border"
            onClick={() => exportReportsToCSV(reports)}
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Operador</label>
            <Select
              value={operatorFilter}
              onValueChange={(v) => {
                onOperatorFilterChange(v);
                resetPage();
              }}
            >
              <SelectTrigger className="h-9 rounded-md border-border bg-muted/20 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueOperators.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                onDateFromChange(e.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border-border bg-muted/20 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                onDateToChange(e.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border-border bg-muted/20 text-xs"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 w-full text-xs text-muted-foreground"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      )}
    </BentoCard>
  );
}
