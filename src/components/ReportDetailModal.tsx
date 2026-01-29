import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ReportSocials } from "@/components/ReportSocials"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User as UserIcon, Tag, Activity, Eye, ArrowLeft } from "lucide-react"

import { Report, User } from "@/types"

interface ReportDetailModalProps {
    isOpen: boolean
    onClose: () => void
    report: Report | null
    currentUser: User | null
    onUpdate: () => void
}

export function ReportDetailModal({ isOpen, onClose, report, currentUser, onUpdate }: ReportDetailModalProps) {
    const [users, setUsers] = React.useState<User[]>([])

    React.useEffect(() => {
        if (isOpen) {
            fetch('/api/users')
                .then(res => res.json())
                .then(data => setUsers(data))
                .catch(console.error)
        }
    }, [isOpen])

    React.useEffect(() => {
        if (isOpen && report && currentUser) {
            fetch('/api/reports/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId: report.id, userId: currentUser.id })
            }).then(() => {
                // Optional: Trigger refresh? Or Just assume it works.
                // onUpdate() might be too aggressive (refetch all).
            }).catch(console.error)
        }
    }, [isOpen, report, currentUser]) // Added dependencies

    if (!report) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="fixed !left-0 !top-0 !right-0 !bottom-0 !z-[50000] !w-[100vw] !h-[100dvh] !max-w-none !rounded-none !border-0 !translate-x-0 !translate-y-0 p-0 gap-0 bg-gradient-to-b from-white/10 via-black/20 to-black/60 backdrop-blur-xl backdrop-saturate-150 text-slate-100 shadow-none duration-300 md:!left-[50%] md:!top-[50%] md:!translate-x-[-50%] md:!translate-y-[-50%] md:!w-full md:!max-w-4xl md:!h-auto md:!max-h-[85vh] md:!rounded-3xl md:!border md:!border-white/10 md:shadow-2xl overflow-hidden flex flex-col box-border ring-0 md:ring-1 md:ring-white/10">
                <div className="w-full h-full overflow-y-auto pb-32 md:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                    {/* Dummy element to trap initial focus and prevent tooltip auto-open */}
                    <div tabIndex={0} className="sr-only" aria-hidden="true" />
                    <DialogHeader className="p-4 md:p-0 bg-transparent border-b border-white/5 md:border-none shadow-sm md:shadow-none relative mb-4 md:mb-0">
                        <div className="flex items-center gap-4 pr-2">
                            {/* Mobile Close Button */}
                            <div
                                onClick={onClose}
                                className="md:hidden p-2 -ml-2 rounded-full active:bg-white/10 text-slate-400 cursor-pointer"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-lg md:text-2xl font-bold flex items-center gap-4 truncate">
                                    <span>Reporte #{report.id.slice(0, 6)}</span>
                                    <Badge variant="outline" className="hidden sm:inline-flex font-normal border-slate-200 dark:border-white/10 text-slate-500">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 mt-1">
                                    Detalles completos e historial de seguimiento.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 md:p-0">
                        {/* Left Column: Meta & Socials */}
                        <div className="flex flex-col gap-6">
                            {/* Meta Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <UserIcon className="w-4 h-4 text-[#FF0C60]" />
                                    <span className="font-medium text-slate-900 dark:text-white">{report.operatorName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Tag className="w-4 h-4 text-slate-500" />
                                    <span className="capitalize">{report.category}</span>
                                    <span className="text-slate-300 dark:text-slate-700">|</span>
                                    <span className="">{report.priority}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    <span className="capitalize">{report.status === 'resolved' ? 'Resuelto' : report.status}</span>
                                </div>
                            </div>

                            {/* Social Section */}
                            <div className="border-t pt-4 border-slate-100 dark:border-white/5">
                                <ReportSocials
                                    reportId={report.id}
                                    currentUser={currentUser}
                                    initialComments={report.comments || []}
                                    initialReactions={report.reactions || []}
                                    availableUsers={users}
                                    onUpdate={onUpdate}
                                />
                            </div>
                        </div>

                        {/* Right Column: Description */}
                        <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-100 dark:border-white/5 h-full">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Descripción del Problema</h4>
                            <ScrollArea className="h-auto max-h-[500px] min-h-[200px] w-full rounded-md pr-4">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {report.problemDescription}
                                </p>
                            </ScrollArea>

                            {/* Attachments */}
                            {report.attachments && report.attachments.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Adjuntos</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {report.attachments.map((file: any, idx: number) => (
                                            <div key={idx} className="relative w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center group cursor-pointer" onClick={() => window.open(file.url, '_blank')}>
                                                {file.type === 'IMAGE' ? (
                                                    <img src={file.url} alt="Adjunto" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
                                                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">VIDEO</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Report Views */}
                    {report.views && report.views.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                            <Eye className="w-3 h-3" />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <span>Visto por: {report.views.map((v: any) => v.user.name).join(', ')}</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    )
}
