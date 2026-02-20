import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowRight } from "lucide-react"

// Duplicate interface to avoid circular dependency for now, or move to types.ts later
interface Task {
    id: string
    title: string
    description?: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    deadline?: string
    scheduledDate: string
    status: 'PENDING' | 'COMPLETED' | 'INCOMPLETE'
    comment?: string
    completedAt?: string
    reminderSent?: boolean
}

export function TaskCard({ task, isToday, onClick, isCompleted }: { task: Task, isToday: boolean, onClick?: () => void, isCompleted?: boolean }) {
    const isHighPriority = task.priority === 'HIGH'
    const isMediumPriority = task.priority === 'MEDIUM'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            className={`
                relative p-4 rounded-xl border transition-all duration-300 group
                ${isCompleted
                    ? 'bg-slate-50/50 dark:bg-white/5 border-transparent opacity-70'
                    : 'bg-white dark:bg-[#18181B] border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md'
                }
                ${isToday && !isCompleted ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
                ${!isCompleted && isHighPriority ? 'border-l-4 border-l-red-500' : ''}
                ${!isCompleted && isMediumPriority ? 'border-l-4 border-l-amber-500' : ''}
            `}
        >
            <div className="flex items-center gap-3">
                {/* Check Circle */}
                <div
                    className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300
                        ${isCompleted
                            ? 'bg-emerald-500 border-emerald-500 scale-100'
                            : isToday
                                ? 'border-slate-300 dark:border-slate-600 group-hover:border-[#FF0C60] scale-90 group-hover:scale-100'
                                : 'border-slate-200 dark:border-slate-800'
                        }
                    `}
                >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className={`text-sm font-semibold truncate pr-2 ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                            {task.title}
                        </h3>
                        <div className="flex gap-1 shrink-0">
                            {task.reminderSent && !isCompleted && (
                                <Badge variant="outline" className="text-[10px] h-5 px-2 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                                    Recordatorio enviado
                                </Badge>
                            )}
                            {!isCompleted && task.deadline && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono bg-slate-100 dark:bg-white/10 text-slate-500">
                                    {task.deadline}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Sub lines */}
                    <div className="flex items-center gap-2 mt-1">
                        {!isCompleted && (
                            <span className={`text-[10px] font-bold tracking-tight ${isHighPriority ? 'text-red-500' :
                                isMediumPriority ? 'text-amber-500' :
                                    'text-slate-400'
                                }`}>
                                {task.priority === 'HIGH' ? 'Alta Prioridad' : task.priority === 'MEDIUM' ? 'Prioridad Media' : 'Baja Prioridad'}
                            </span>
                        )}

                        {isCompleted && task.comment && (
                            <p className="text-xs text-slate-500 italic truncate max-w-[200px]">
                                "{task.comment}"
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Arrow */}
                {isToday && !isCompleted && (
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#FF0C60] group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-white" />
                    </div>
                )}
            </div>
        </motion.div>
    )
}
