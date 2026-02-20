
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDangerous = false
}: ConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#18181B] border-white/10 text-slate-200">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-white">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400 text-base">
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="hover:bg-white/5 text-slate-400 hover:text-white"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`${isDangerous ? 'bg-red-500 hover:bg-red-600' : 'bg-[#FF0C60] hover:bg-[#D90A50]'} text-white font-bold`}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
