"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, AlertCircle } from "lucide-react"
import { Report } from "@/types"
import usersData from "@/data/users.json"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export default function CreateReport() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    operatorEmail: "",
    problemDescription: "",
    dateStarted: "",
    dateResolved: "",
    isResolved: false,
    priority: "medium",
    category: "transmision"
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const operator = usersData.users.find(user => user.email === formData.operatorEmail)
      if (!operator) throw new Error("Email de operador no encontrado en el sistema")

      const newReport: Report = {
        id: generateReportId(),
        operatorId: operator.id,
        operatorName: operator.name,
        operatorEmail: operator.email,
        problemDescription: formData.problemDescription,
        dateStarted: formData.dateStarted,
        dateResolved: formData.isResolved ? formData.dateResolved : undefined,
        isResolved: formData.isResolved,
        status: formData.isResolved ? 'resolved' : 'pending',
        priority: formData.priority as 'Enlace' | 'EJTV' | 'EnlaceUSA' | 'Todos',
        category: formData.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const existingReports = localStorage.getItem('enlace-reports')
      const reports: Report[] = existingReports ? JSON.parse(existingReports) : []
      reports.push(newReport)
      localStorage.setItem('enlace-reports', JSON.stringify(reports))

      setSuccess(true)
      setTimeout(() => router.push('/reports'), 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el reporte")
    } finally {
      setLoading(false)
    }
  }

  const generateReportId = () => `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  const glassBg = "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-lg shadow-black/20 rounded-2xl"

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(240,10%,3.9%)" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-full max-w-md ${glassBg} text-white`}
        >
          <Card className="bg-transparent border-0 text-white">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-20 h-20 bg-green-500/20 backdrop-blur-3xl rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Send className="w-10 h-10 text-green-400" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-3 tracking-tight">
                  ¡Reporte Creado!
                </h2>
                <p className="text-white/60 mb-6 px-4">
                  El reporte ha sido registrado en el sistema exitosamente.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-white/40">
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                  Redirigiendo al dashboard...
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "hsl(240,10%,3.9%)" }}>
      <div className="max-w-4xl mx-auto space-y-8 text-white">
        {/* Header */}
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/">
            <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5 hover:text-white bg-transparent transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Crear Nuevo Reporte
            </h1>
            <p className="text-white/60">
              Registra un problema técnico o incidente de transmisión
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`${glassBg} text-white`}>
            <CardHeader className="border-b border-white/5 pb-6">
              <CardTitle>Información del Reporte</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-8">

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Alert className="border-red-500/20 bg-red-500/10 backdrop-blur-3xl text-red-200 rounded-xl">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Operador */}
                  <div className="space-y-2">
                    <Label htmlFor="operatorEmail" className="text-white/80 font-medium">Email del Operador <span className="text-red-400">*</span></Label>
                    <Select
                      value={formData.operatorEmail}
                      onValueChange={(value) => handleInputChange('operatorEmail', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white placeholder-white/20 h-12 rounded-xl focus:ring-2 focus:ring-white/10 focus:ring-offset-0">
                        <SelectValue placeholder="Seleccionar operador" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 text-white max-h-[300px]">
                        {usersData.users.map((user) => (
                          <SelectItem key={user.id} value={user.email} className="focus:bg-white/10 focus:text-white cursor-pointer">{user.name} ({user.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prioridad */}
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-white/80 font-medium"> Canal <span className="text-red-400">*</span></Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleInputChange('priority', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-2 focus:ring-white/10 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                        <SelectItem value="Enlace" className="focus:bg-white/10 focus:text-white cursor-pointer">Enlace</SelectItem>
                        <SelectItem value="EJTV" className="focus:bg-white/10 focus:text-white cursor-pointer">EJTV</SelectItem>
                        <SelectItem value="Enlace USA" className="focus:bg-white/10 focus:text-white cursor-pointer">EnlaceUSA</SelectItem>
                        <SelectItem value="Todos" className="focus:bg-white/10 focus:text-white cursor-pointer">Todos (Enlace USA, Enlace, EJTV y EnlaceCR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Categoría */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white/80 font-medium">Categoría <span className="text-red-400">*</span></Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-2 focus:ring-white/10 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                        <SelectItem value="transmision" className="focus:bg-white/10 focus:text-white cursor-pointer">Transmisión</SelectItem>
                        <SelectItem value="audio" className="focus:bg-white/10 focus:text-white cursor-pointer">Audio</SelectItem>
                        <SelectItem value="video" className="focus:bg-white/10 focus:text-white cursor-pointer">Video</SelectItem>
                        <SelectItem value="equipos" className="focus:bg-white/10 focus:text-white cursor-pointer">Equipos</SelectItem>
                        <SelectItem value="software" className="focus:bg-white/10 focus:text-white cursor-pointer">Software</SelectItem>
                        <SelectItem value="Channel Box" className="focus:bg-white/10 focus:text-white cursor-pointer">Channel Box</SelectItem>
                        <SelectItem value="Bitcentral" className="focus:bg-white/10 focus:text-white cursor-pointer">Caída de Servidores Bitcentral</SelectItem>
                        <SelectItem value="Falla Energética" className="focus:bg-white/10 focus:text-white cursor-pointer">Falla Energética</SelectItem>
                        <SelectItem value="otros" className="focus:bg-white/10 focus:text-white cursor-pointer">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fecha del Problema */}
                  <div className="space-y-2">
                    <Label htmlFor="dateStarted" className="text-white/80 font-medium">Fecha del Problema <span className="text-red-400">*</span></Label>
                    <Input
                      id="dateStarted"
                      type="datetime-local"
                      value={formData.dateStarted}
                      onChange={(e) => handleInputChange('dateStarted', e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder-white/20 h-12 rounded-xl focus:ring-2 focus:ring-white/10 focus:border-transparent invert-calendar-icon"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="problemDescription" className="text-white/80 font-medium">Descripción del Problema <span className="text-red-400">*</span></Label>
                  <Textarea
                    id="problemDescription"
                    placeholder="Describe detalladamente el problema encontrado..."
                    value={formData.problemDescription}
                    onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                    required
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder-white/20 rounded-xl focus:ring-2 focus:ring-white/10 focus:border-transparent resize-none leading-relaxed"
                  />
                </div>

                {/* Resuelto */}
                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isResolved"
                      checked={formData.isResolved}
                      onChange={(e) => handleInputChange('isResolved', e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 rounded focus:ring-offset-0 focus:ring-emerald-500 cursor-pointer"
                    />
                    <Label htmlFor="isResolved" className="text-white font-medium cursor-pointer select-none">
                      ¿El problema ha sido resuelto?
                    </Label>
                  </div>

                  <AnimatePresence>
                    {formData.isResolved && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          <Label htmlFor="dateResolved" className="text-white/80 font-medium">Fecha de Resolución <span className="text-red-400">*</span></Label>
                          <Input
                            id="dateResolved"
                            type="datetime-local"
                            value={formData.dateResolved}
                            onChange={(e) => handleInputChange('dateResolved', e.target.value)}
                            required={formData.isResolved}
                            className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus:ring-emerald-500/30 focus:border-emerald-500/50"
                            style={{ colorScheme: "dark" }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Link href="/">
                    <Button variant="outline" disabled={loading} className="border-white/10 text-white hover:bg-white/5 hover:text-white bg-transparent h-12 px-6 rounded-xl transition-all">
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="bg-white text-black hover:bg-white/90 h-12 px-8 rounded-xl font-semibold shadow-lg shadow-white/5 hover:shadow-white/10 hover:scale-[1.02] transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/30 border-t-black mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Crear Reporte
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
