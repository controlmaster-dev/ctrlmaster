"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Filter, Plus, FileText, ArrowLeft } from "lucide-react"
import { Report } from "@/types"
import { generateReportPDF } from "@/utils/pdfGenerator"
import Link from "next/link"



export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    const savedReports = localStorage.getItem('enlace-reports')
    const reportsData: Report[] = savedReports ? JSON.parse(savedReports) : []
    setReports(reportsData)
    setFilteredReports(reportsData)
  }, [])

  useEffect(() => {
    let filtered = reports
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.problemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (statusFilter !== "all") filtered = filtered.filter(report => report.status === statusFilter)
    if (priorityFilter !== "all") filtered = filtered.filter(report => report.priority === priorityFilter)
    if (categoryFilter !== "all") filtered = filtered.filter(report => report.category === categoryFilter)
    setFilteredReports(filtered)
  }, [reports, searchTerm, statusFilter, priorityFilter, categoryFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <Badge className="bg-green-700 text-green-100">Resuelto</Badge>
      case 'in-progress': return <Badge className="bg-yellow-700 text-yellow-100">En Progreso</Badge>
      case 'pending': return <Badge className="bg-red-700 text-red-100">Pendiente</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Enlace': return <Badge className="bg-red-600 text-white">Enlace</Badge>
      case 'EJTV': return <Badge className="bg-orange-600 text-white">EJTV</Badge>
      case 'EnlaceUSA': return <Badge className="bg-yellow-600 text-white">EnlaceUSA</Badge>
      case 'Todos': return <Badge className="bg-green-600 text-white">Todos</Badge>
      default: return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      transmision: "Transmisión",
      audio: "Audio",
      video: "Video",
      equipos: "Equipos",
      software: "Software",
      infraestructura: "Infraestructura",
      otros: "Otros"
    }
    return labels[category] || category
  }

  const downloadPDF = (report: Report) => {
    try { generateReportPDF(report) }
    catch (error) { console.error(error); alert('Error al generar el PDF.') }
  }

  const glassCard = "bg-white/0 backdrop-blur-3xl border border-white/20 shadow-lg text-white"

  return (
    <div className="space-y-6 p-4 pt-20" style={{ background: "hsl(240,10%,3.9%)" }}>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Reportes</h1>
            <p className="text-gray-300">Gestión de reportes de incidentes técnicos</p>
          </div>
        </div>
        <Link href="/create-report">
          <Button className="bg-gradient-to-r from-[#FF0C60] to-[#FF0C60]/80 hover:from-[#FF0C60]/90 hover:to-[#FF0C60]/70 text-white shadow-xl shadow-[#FF0C60]/25 hover:shadow-2xl hover:shadow-[#FF0C60]/40 transform hover:scale-[1.02] transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Reporte
          </Button>
        </Link>
      </div>


      <Card className={`${glassCard}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" /> <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar reportes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/0 backdrop-blur-3xl text-white border border-white/20 placeholder-gray-400"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/0 backdrop-blur-3xl text-white border border-white/20">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white/0 backdrop-blur-3xl text-white border border-white/20">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in-progress">En Progreso</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-white/0 backdrop-blur-3xl text-white border border-white/20">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent className="bg-white/0 backdrop-blur-3xl text-white border border-white/20">
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/0 backdrop-blur-3xl text-white border border-white/20">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-white/0 backdrop-blur-3xl text-white border border-white/20">
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="transmision">Transmisión</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="equipos">Equipos</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="infraestructura">Infraestructura</SelectItem>
                <SelectItem value="otros">Otros</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setPriorityFilter("all")
                setCategoryFilter("all")
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>


      <Card className={`${glassCard}`}>
        <CardHeader>
          <CardTitle>Reportes ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="bg-white/0 backdrop-blur-3xl text-white border border-white/20">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Problema</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Canal(es) Afectado(s)</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-sm">{report.id.slice(0, 12)}...</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.operatorName}</div>
                          <div className="text-sm text-gray-400">{report.operatorEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{report.problemDescription}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-white/20 text-white">
                          {getCategoryLabel(report.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(report.createdAt).toLocaleDateString('es-ES')}</div>
                        <div className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleTimeString('es-ES')}</div>
                      </TableCell>


                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-white hover:text-white" onClick={() => downloadPDF(report)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No se encontraron reportes</h3>
              <p className="text-gray-300 mb-4">
                {reports.length === 0
                  ? "Aún no se han creado reportes en el sistema."
                  : "No hay reportes que coincidan con los filtros aplicados."
                }
              </p>
              <Link href="/create-report">
                <Button className="bg-gradient-to-r from-[#FF0C60] to-[#FF0C60]/80 hover:from-[#FF0C60]/90 hover:to-[#FF0C60]/70 text-white shadow-xl shadow-[#FF0C60]/25 hover:shadow-2xl hover:shadow-[#FF0C60]/40 transform hover:scale-[1.02] transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Reporte
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
