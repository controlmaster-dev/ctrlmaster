import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, Check, Mail, Settings, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvidenceStepProps {
  formData: {
    attachments: any[];
    isResolved: boolean;
    dateResolved: string;
    sendEmail: boolean;
    emailRecipients: string;
  };
  handleInputChange: (field: string, value: any) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export function EvidenceStep({ formData, handleInputChange, handleFileUpload, uploading }: EvidenceStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-8"
    >
      <div className="space-y-3 mb-10">
        <div className="h-1 w-10 bg-[#ff3366] rounded-full" />
        <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tighter leading-tight">
          Cierre y <br /> <span className="text-[#ff3366]">Evidencia</span>
        </h2>
        <p className="text-muted-foreground text-sm font-normal border-l border-border/80 pl-4">
          Validación visual y confirmación final.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-foreground text-[10px] font-medium tracking-wider uppercase opacity-50">
            Material Gráfico (Opcional)
          </Label>
          <div className="space-y-3">
            {formData.attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border group hover:border-[#ff3366]/20 transition-all">
                <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden ring-1 ring-border shadow-inner">
                  <img src={file.data || file.url} className="w-full h-full object-cover filter contrast-125" alt="Evidence" />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-medium text-muted-foreground block mb-0.5 uppercase tracking-wider">Archivo {idx + 1}</span>
                  <span className="text-xs font-medium text-foreground truncate block">{file.url}</span>
                </div>
                <button
                  onClick={() => {
                    const A = [...formData.attachments];
                    A.splice(idx, 1);
                    handleInputChange('attachments', A);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500 hover:text-white text-muted-foreground transition-all bg-muted/20"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ))}
            
            <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-border rounded-xl hover:border-[#ff3366] hover:bg-[#ff3366]/5 transition-all cursor-pointer bg-card group shadow-sm">
              <Upload className="w-5 h-5 text-muted-foreground group-hover:text-[#ff3366] transition-colors mb-2" />
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Seleccionar evidencia</span>
              <span className="text-[9px] text-muted-foreground/50 mt-1 font-normal italic">Máximo 4MB</span>
              <input type="file" multiple hidden onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-xl space-y-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-start gap-4">
            <div className="w-5 h-5 rounded border bg-[#ff3366] border-[#ff3366] flex items-center justify-center cursor-not-allowed opacity-40 shadow-sm shadow-rose-500/10">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
            <div className="flex-1 opacity-80">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground tracking-tight leading-none">Situación Resuelta</span>
                <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-tighter">Auto</div>
              </div>
              <p className="text-[10px] text-muted-foreground font-normal leading-relaxed max-w-sm">
                Marcar como <strong>Resuelto</strong> automáticamente. 
                <span className="inline-flex items-center gap-1 ml-1 text-[9px] text-amber-500 italic">
                   Opción inactiva
                </span>
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/20">
            <Label className="text-foreground text-[9px] font-medium mb-2 block uppercase tracking-wider opacity-50">Marca de Tiempo de Resolución</Label>
            <Input 
              type="datetime-local" 
              value={formData.dateResolved} 
              onChange={(e) => handleInputChange('dateResolved', e.target.value)} 
              className="bg-card border border-border text-foreground h-11 text-base font-medium rounded-lg focus:border-[#ff3366] transition-all px-4"
            />
          </div>
        </div>

        <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-5 shadow-sm group transition-all hover:border-indigo-500/40">
          <div className="flex items-start gap-4">
            <div 
              className={cn(
                "w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all shadow-sm",
                formData.sendEmail ? "bg-indigo-500 border-indigo-500 scale-105 shadow-md shadow-indigo-500/10" : "border-border bg-card"
              )} 
              onClick={() => handleInputChange('sendEmail', !formData.sendEmail)}
            >
              {formData.sendEmail && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => handleInputChange('sendEmail', !formData.sendEmail)}>
              <div className="flex items-center gap-2 mb-1">
                <Mail className={cn("w-3.5 h-3.5 transition-colors", formData.sendEmail ? "text-indigo-400" : "text-muted-foreground")} />
                <span className="text-sm font-medium text-foreground tracking-tight leading-none">Notificación Automática</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-normal leading-relaxed">
                Enviar un correo con el PDF a los interesados.
              </p>
            </div>
          </div>
          
          <AnimatePresence>
            {formData.sendEmail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-indigo-500/10">
                  <Label className="text-foreground text-[9px] font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wider opacity-50">
                    <Settings className="w-3 h-3" /> Destinatarios
                  </Label>
                  <Input 
                    type="text" 
                    value={formData.emailRecipients} 
                    onChange={(e) => handleInputChange('emailRecipients', e.target.value)} 
                    className="bg-card border border-border text-foreground h-11 text-xs font-medium rounded-lg focus:border-indigo-500 px-4 transition-all"
                    placeholder="ingenieria@enlace.org"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
