"use client"

import { useState } from "react"

import { ChevronDown, ChevronUp } from "lucide-react"

interface DescriptionCellProps {
    text: string
    maxLength?: number
    className?: string
}

export function DescriptionCell({ text, maxLength = 60, className }: DescriptionCellProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const shouldTruncate = text.length > maxLength

    return (
        <div
            className={`relative group cursor-pointer transition-all duration-200 ${isExpanded ? 'bg-white/5 -m-2 p-2 rounded-lg z-10 shadow-xl border border-white/10' : ''} ${className}`}
            onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
        >
            <div className="flex items-start justify-between gap-2">
                <p className={`text-sm text-slate-300 leading-relaxed ${!isExpanded && 'truncate'}`} style={{ maxWidth: isExpanded ? 'none' : '250px' }}>
                    {isExpanded ? text : text}
                </p>
                {shouldTruncate && (
                    <span className="text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity mt-1">
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                )}
            </div>
        </div>
    )
}
