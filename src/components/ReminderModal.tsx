"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Operator {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
}

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  operators: Operator[];
}

export function ReminderModal({ isOpen, onClose, operators }: ReminderModalProps) {
  const [selectedOperator, setSelectedOperator] = useState("");
  const [method, setMethod] = useState<"whatsapp" | "email" | "both">("both");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ whatsapp?: string; email?: string } | null>(null);

  const selectedOp = operators.find(o => o.id === selectedOperator);

  const handleSend = async () => {
    if (!selectedOperator) {
      toast.error("Selecciona un operador primero");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/cron/manual-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: selectedOperator, method }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.results);
        toast.success(`Recordatorio enviado a ${data.operator}`);
      } else {
        toast.error(data.error || "Error al enviar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSending(false);
    }
  };

  const resetAndClose = () => {
    setSelectedOperator("");
    setMethod("both");
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#FF0C60]" />
            Enviar Recordatorio
          </DialogTitle>
          <DialogDescription>
            Envía un recordatorio manual a un operador sobre su turno de pauta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Operator Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Operador</label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar operador..." />
              </SelectTrigger>
              <SelectContent>
                {operators.map(op => (
                  <SelectItem key={op.id} value={op.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={op.image || undefined} />
                        <AvatarFallback className="text-[8px]">{op.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{op.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Operator Info */}
          {selectedOp && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedOp.image || undefined} />
                  <AvatarFallback>{selectedOp.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{selectedOp.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedOp.email}</p>
                  {selectedOp.phone && (
                    <p className="text-xs text-muted-foreground">{selectedOp.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Método de envío</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={method === "whatsapp" ? "default" : "outline"}
                onClick={() => setMethod("whatsapp")}
                className={`h-20 flex flex-col gap-1 ${
                  method === "whatsapp" ? "bg-emerald-500 hover:bg-emerald-600" : ""
                }`}
                disabled={!selectedOp?.phone}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">WhatsApp</span>
                {!selectedOp?.phone && (
                  <span className="text-[9px] text-muted-foreground">Sin número</span>
                )}
              </Button>
              <Button
                variant={method === "email" ? "default" : "outline"}
                onClick={() => setMethod("email")}
                className={`h-20 flex flex-col gap-1 ${
                  method === "email" ? "bg-violet-500 hover:bg-violet-600" : ""
                }`}
              >
                <Mail className="w-5 h-5" />
                <span className="text-xs">Correo</span>
              </Button>
              <Button
                variant={method === "both" ? "default" : "outline"}
                onClick={() => setMethod("both")}
                className={`h-20 flex flex-col gap-1 ${
                  method === "both" ? "bg-[#FF0C60] hover:bg-[#FF0080]" : ""
                }`}
                disabled={!selectedOp?.phone}
              >
                <Send className="w-5 h-5" />
                <span className="text-xs">Ambos</span>
              </Button>
            </div>
          </div>

          {/* Result Status */}
          {result && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs font-medium text-foreground mb-2">Estado del envío:</p>
              {result.whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs">
                    WhatsApp:{" "}
                    {result.whatsapp === "sent" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px]">Enviado</Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-500 text-[10px]">Falló</Badge>
                    )}
                  </span>
                </div>
              )}
              {result.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-violet-500" />
                  <span className="text-xs">
                    Correo:{" "}
                    {result.email === "sent" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px]">Enviado</Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-500 text-[10px]">Falló</Badge>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={resetAndClose} disabled={sending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !selectedOperator}
            className="bg-[#FF0C60] hover:bg-[#FF0080]"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Recordatorio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
