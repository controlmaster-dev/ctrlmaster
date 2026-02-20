
import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Mail, Plus, X } from "lucide-react"

interface EmailSendModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (recipients: string[]) => void
    reportId: string
    title?: string
}

const DEFAULT_RECIPIENTS = ['rjimenez@enlace.org', 'ingenieria@enlace.org']

export function EmailSendModal({
    isOpen,
    onClose,
    onConfirm,
    reportId,
    title = "Enviar Reporte por Correo"
}: EmailSendModalProps) {
    const [useDefaults, setUseDefaults] = useState(true)
    const [customEmails, setCustomEmails] = useState<string[]>([])
    const [inputValue, setInputValue] = useState("")

    const handleAddEmail = () => {
        if (inputValue && inputValue.includes('@')) {
            setCustomEmails([...customEmails, inputValue.trim()])
            setInputValue("")
        }
    }

    const handleRemoveEmail = (email: string) => {
        setCustomEmails(customEmails.filter(e => e !== email))
    }

    const handleConfirm = () => {
        let finalRecipients: string[] = []
        if (useDefaults) finalRecipients = [...DEFAULT_RECIPIENTS]
        finalRecipients = [...finalRecipients, ...customEmails]

        // Remove duplicates
        finalRecipients = Array.from(new Set(finalRecipients))

        onConfirm(finalRecipients)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#FF0C60]/10 text-[#FF0C60] flex items-center justify-center">
                            <Mail className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground">
                        Configura los destinatarios para el reporte <span className="text-foreground font-mono font-bold">#{reportId.slice(0, 6)}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Default Recipients Toggle */}
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                        <Checkbox
                            id="defaults"
                            checked={useDefaults}
                            onCheckedChange={(c) => setUseDefaults(c as boolean)}
                            className="mt-1 data-[state=checked]:bg-[#FF0C60] border-muted-foreground"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="defaults" className="text-sm font-medium text-foreground cursor-pointer">
                                Enviar a Ingeniería (Default)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {DEFAULT_RECIPIENTS.join(", ")}
                            </p>
                        </div>
                    </div>

                    {/* Custom Emails */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground tracking-tight">Otros destinatarios</Label>
                        <div className="flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="ejemplo@enlace.org"
                                className="bg-background border-border text-foreground focus-visible:ring-[#FF0C60]"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                            />
                            <Button
                                onClick={handleAddEmail}
                                size="icon"
                                variant="secondary"
                                disabled={!inputValue.includes('@')}
                                className="shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Chip List */}
                        {customEmails.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {customEmails.map(email => (
                                    <div key={email} className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-muted border border-border text-xs text-foreground">
                                        <span>{email}</span>
                                        <button onClick={() => handleRemoveEmail(email)} className="p-1 hover:text-[#FF0C60] rounded-full transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="bg-[#FF0C60] hover:bg-[#D90A50] text-white font-bold min-w-[100px]"
                        disabled={!useDefaults && customEmails.length === 0}
                    >
                        Enviar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
