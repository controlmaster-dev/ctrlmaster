"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Filter, Plus, FileText, ArrowLeft } from "lucide-react";

import { generateReportPDF } from "@/utils/pdfGenerator";
import Link from "next/link"; import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const savedReports = localStorage.getItem('enlace-reports');
    const reportsData = savedReports ? JSON.parse(savedReports) : [];
    setReports(reportsData);
    setFilteredReports(reportsData);
  }, []);

  useEffect(() => {
    let filtered = reports;
    if (searchTerm) {
      filtered = filtered.filter((report) =>
        report.problemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") filtered = filtered.filter((report) => report.status === statusFilter);
    if (priorityFilter !== "all") filtered = filtered.filter((report) => report.priority === priorityFilter);
    if (categoryFilter !== "all") filtered = filtered.filter((report) => report.category === categoryFilter);
    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved': return _jsx(Badge, { className: "bg-green-700 text-green-100", children: "Resuelto" });
      case 'in-progress': return _jsx(Badge, { className: "bg-yellow-700 text-yellow-100", children: "En Progreso" });
      case 'pending': return _jsx(Badge, { className: "bg-red-700 text-red-100", children: "Pendiente" });
      default: return _jsx(Badge, { variant: "secondary", children: status });
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Enlace': return _jsx(Badge, { className: "bg-red-600 text-white", children: "Enlace" });
      case 'EJTV': return _jsx(Badge, { className: "bg-orange-600 text-white", children: "EJTV" });
      case 'EnlaceUSA': return _jsx(Badge, { className: "bg-yellow-600 text-white", children: "EnlaceUSA" });
      case 'Todos': return _jsx(Badge, { className: "bg-green-600 text-white", children: "Todos" });
      default: return _jsx(Badge, { variant: "secondary", children: priority });
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      transmision: "Transmisión",
      audio: "Audio",
      video: "Video",
      equipos: "Equipos",
      software: "Software",
      infraestructura: "Infraestructura",
      otros: "Otros"
    };
    return labels[category] || category;
  };

  const downloadPDF = (report) => {
    try { generateReportPDF(report); }
    catch (error) { console.error(error); alert('Error al generar el PDF.'); }
  };

  const glassCard = "bg-white/0 backdrop-blur-3xl border border-white/20 shadow-lg text-white";

  return (
    _jsxs("div", {
      className: "space-y-6 p-4 pt-20 md:pt-6", children: [

        _jsxs("div", {
          className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white", children: [
            _jsxs("div", {
              className: "flex items-center space-x-4", children: [
                _jsx(Link, {
                  href: "/", children:
                    _jsxs(Button, {
                      variant: "outline", size: "sm", className: "border-white/20 text-white hover:bg-white/10", children: [
                        _jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Dashboard"]
                    }

                    )
                }
                ),
                _jsxs("div", {
                  children: [
                    _jsx("h1", { className: "text-3xl font-bold", children: "Reportes" }),
                    _jsx("p", { className: "text-gray-300", children: "Gesti\xF3n de reportes de incidentes t\xE9cnicos" })]
                }
                )]
            }
            ),
            _jsx(Link, {
              href: "/create-report", children:
                _jsxs(Button, {
                  className: "bg-gradient-to-r from-[#FF0C60] to-[#FF0C60]/80 hover:from-[#FF0C60]/90 hover:to-[#FF0C60]/70 text-white shadow-xl shadow-[#FF0C60]/25 hover:shadow-2xl hover:shadow-[#FF0C60]/40 transform hover:scale-[1.02] transition-all duration-300", children: [
                    _jsx(Plus, { className: "w-4 h-4 mr-2" }), " Nuevo Reporte"]
                }
                )
            }
            )]
        }
        ),


        _jsxs(Card, {
          className: `${glassCard}`, children: [
            _jsx(CardHeader, {
              children:
                _jsxs(CardTitle, {
                  className: "flex items-center space-x-2", children: [
                    _jsx(Filter, { className: "w-5 h-5" }), " ", _jsx("span", { children: "Filtros" })]
                }
                )
            }
            ),
            _jsx(CardContent, {
              children:
                _jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: [
                    _jsxs("div", {
                      className: "relative", children: [
                        _jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }),
                        _jsx(Input, {
                          placeholder: "Buscar reportes...",
                          value: searchTerm,
                          onChange: (e) => setSearchTerm(e.target.value),
                          className: "pl-10 bg-white/0 backdrop-blur-3xl text-white border border-white/20 placeholder-gray-400"
                        }
                        )]
                    }
                    ),

                    _jsxs(Select, {
                      value: statusFilter, onValueChange: setStatusFilter, children: [
                        _jsx(SelectTrigger, {
                          className: "bg-white/0 backdrop-blur-3xl text-white border border-white/20", children:
                            _jsx(SelectValue, { placeholder: "Estado" })
                        }
                        ),
                        _jsxs(SelectContent, {
                          className: "bg-white/0 backdrop-blur-3xl text-white border border-white/20", children: [
                            _jsx(SelectItem, { value: "all", children: "Todos los estados" }),
                            _jsx(SelectItem, { value: "pending", children: "Pendiente" }),
                            _jsx(SelectItem, { value: "in-progress", children: "En Progreso" }),
                            _jsx(SelectItem, { value: "resolved", children: "Resuelto" })]
                        }
                        )]
                    }
                    ),

                    _jsxs(Select, {
                      value: priorityFilter, onValueChange: setPriorityFilter, children: [
                        _jsx(SelectTrigger, {
                          className: "bg-white/0 backdrop-blur-3xl text-white border border-white/20", children:
                            _jsx(SelectValue, { placeholder: "Prioridad" })
                        }
                        ),
                        _jsxs(SelectContent, {
                          className: "bg-white/0 backdrop-blur-3xl text-white border border-white/20", children: [
                            _jsx(SelectItem, { value: "all", children: "Todas las prioridades" }),
                            _jsx(SelectItem, { value: "critical", children: "Cr\xEDtica" }),
                            _jsx(SelectItem, { value: "high", children: "Alta" }),
                            _jsx(SelectItem, { value: "medium", children: "Media" }),
                            _jsx(SelectItem, { value: "low", children: "Baja" })]
                        }
                        )]
                    }
                    ),

                    _jsxs(Select, {
                      value: categoryFilter, onValueChange: setCategoryFilter, children: [
                        _jsx(SelectTrigger, {
                          className: "bg-white/0 backdrop-blur-3xl text-white border border-white/20", children:
                            _jsx(SelectValue, { placeholder: "Categor\xEDa" })
                        }
                        ),
                        _jsxs(SelectContent, {
                          className: "bg-white/0 backdrop-blur-3xl text-white border border-white/20", children: [
                            _jsx(SelectItem, { value: "all", children: "Todas las categor\xEDas" }),
                            _jsx(SelectItem, { value: "transmision", children: "Transmisi\xF3n" }),
                            _jsx(SelectItem, { value: "audio", children: "Audio" }),
                            _jsx(SelectItem, { value: "video", children: "Video" }),
                            _jsx(SelectItem, { value: "equipos", children: "Equipos" }),
                            _jsx(SelectItem, { value: "software", children: "Software" }),
                            _jsx(SelectItem, { value: "infraestructura", children: "Infraestructura" }),
                            _jsx(SelectItem, { value: "otros", children: "Otros" })]
                        }
                        )]
                    }
                    ),

                    _jsx(Button, {
                      variant: "outline",
                      className: "border-white/20 text-white hover:bg-white/10",
                      onClick: () => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                        setCategoryFilter("all");
                      }, children:
                        "Limpiar"
                    }

                    )]
                }
                )
            }
            )]
        }
        ),


        _jsxs(Card, {
          className: `${glassCard}`, children: [
            _jsx(CardHeader, {
              children:
                _jsxs(CardTitle, { children: ["Reportes (", filteredReports.length, ")"] })
            }
            ),
            _jsx(CardContent, {
              children:
                filteredReports.length > 0 ?
                  _jsx("div", {
                    className: "overflow-x-auto", children:
                      _jsxs(Table, {
                        className: "bg-white/0 backdrop-blur-3xl text-white border border-white/20", children: [
                          _jsx(TableHeader, {
                            children:
                              _jsxs(TableRow, {
                                children: [
                                  _jsx(TableHead, { children: "ID" }),
                                  _jsx(TableHead, { children: "Operador" }),
                                  _jsx(TableHead, { children: "Problema" }),
                                  _jsx(TableHead, { children: "Categor\xEDa" }),
                                  _jsx(TableHead, { children: "Estado" }),
                                  _jsx(TableHead, { children: "Canal(es) Afectado(s)" }),
                                  _jsx(TableHead, { children: "Fecha" }),
                                  _jsx(TableHead, { children: "Acciones" })]
                              }
                              )
                          }
                          ),
                          _jsx(TableBody, {
                            children:
                              filteredReports.map((report) =>
                                _jsxs(TableRow, {
                                  children: [
                                    _jsxs(TableCell, { className: "font-mono text-sm", children: [report.id.slice(0, 12), "..."] }),
                                    _jsx(TableCell, {
                                      children:
                                        _jsxs("div", {
                                          children: [
                                            _jsx("div", { className: "font-medium", children: report.operatorName }),
                                            _jsx("div", { className: "text-sm text-gray-400", children: report.operatorEmail })]
                                        }
                                        )
                                    }
                                    ),
                                    _jsx(TableCell, { className: "max-w-xs truncate", children: report.problemDescription }),
                                    _jsx(TableCell, {
                                      children:
                                        _jsx(Badge, {
                                          variant: "outline", className: "border-white/20 text-white", children:
                                            getCategoryLabel(report.category)
                                        }
                                        )
                                    }
                                    ),
                                    _jsx(TableCell, { children: getStatusBadge(report.status) }),
                                    _jsx(TableCell, { children: getPriorityBadge(report.priority) }),
                                    _jsxs(TableCell, {
                                      children: [
                                        _jsx("div", { className: "text-sm", children: new Date(report.createdAt).toLocaleDateString('es-ES') }),
                                        _jsx("div", { className: "text-xs text-gray-400", children: new Date(report.createdAt).toLocaleTimeString('es-ES') })]
                                    }
                                    ),


                                    _jsx(TableCell, {
                                      children:
                                        _jsx(Button, {
                                          variant: "ghost", size: "sm", className: "text-white hover:text-white", onClick: () => downloadPDF(report), children:
                                            _jsx(Download, { className: "w-4 h-4" })
                                        }
                                        )
                                    }
                                    )]
                                }, report.id
                                )
                              )
                          }
                          )]
                      }
                      )
                  }
                  ) :

                  _jsxs("div", {
                    className: "text-center py-8", children: [
                      _jsx(FileText, { className: "w-12 h-12 mx-auto text-gray-400 mb-4" }),
                      _jsx("h3", { className: "text-lg font-medium text-white mb-2", children: "No se encontraron reportes" }),
                      _jsx("p", {
                        className: "text-gray-300 mb-4", children:
                          reports.length === 0 ?
                            "Aún no se han creado reportes en el sistema." :
                            "No hay reportes que coincidan con los filtros aplicados."
                      }

                      ),
                      _jsx(Link, {
                        href: "/create-report", children:
                          _jsxs(Button, {
                            className: "bg-gradient-to-r from-[#FF0C60] to-[#FF0C60]/80 hover:from-[#FF0C60]/90 hover:to-[#FF0C60]/70 text-white shadow-xl shadow-[#FF0C60]/25 hover:shadow-2xl hover:shadow-[#FF0C60]/40 transform hover:scale-[1.02] transition-all duration-300", children: [
                              _jsx(Plus, { className: "w-4 h-4 mr-2" }), "Crear Primer Reporte"]
                          }

                          )
                      }
                      )]
                  }
                  )
            }

            )]
        }
        )]
    }
    ));

}