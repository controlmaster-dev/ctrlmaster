"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateTimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    disabled?: boolean
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
    const [selectedTime, setSelectedTime] = React.useState<string>("00:00")

    // Update time when date changes or on mount
    React.useEffect(() => {
        if (date) {
            const hours = date.getHours().toString().padStart(2, '0')
            const minutes = date.getMinutes().toString().padStart(2, '0')
            setSelectedTime(`${hours}:${minutes}`)
        }
    }, [date])

    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            const [hours, minutes] = selectedTime.split(':').map(Number)
            newDate.setHours(hours)
            newDate.setMinutes(minutes)
            setDate(newDate)
        } else {
            setDate(undefined)
        }
    }

    const handleTimeChange = (time: string) => {
        setSelectedTime(time)
        if (date) {
            const [hours, minutes] = time.split(':').map(Number)
            const newDate = new Date(date)
            newDate.setHours(hours)
            newDate.setMinutes(minutes)
            setDate(newDate)
        }
    }

    // Generate time options (every 30 mins)
    const timeOptions = React.useMemo(() => {
        const options = []
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 15) {
                const hour = i.toString().padStart(2, '0')
                const minute = j.toString().padStart(2, '0')
                options.push(`${hour}:${minute}`)
            }
        }
        return options
    }, [])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-white h-12 rounded-xl border-white/20 text-gray-900 shadow-sm hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900",
                        !date && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {date ? format(date, "PPP p", { locale: es }) : <span>Seleccionar fecha y hora</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10" align="start">
                <div className="p-3 border-b border-white/10">
                    <div className="flex items-center justify-between gap-2">
                        <Clock className="w-4 h-4 text-white/50" />
                        <Select value={selectedTime} onValueChange={handleTimeChange}>
                            <SelectTrigger className="w-[180px] h-8 bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Seleccionar hora" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white max-h-[200px]">
                                {timeOptions.map((time) => (
                                    <SelectItem key={time} value={time} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        {time}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={es}
                />
            </PopoverContent>
        </Popover>
    )
}
