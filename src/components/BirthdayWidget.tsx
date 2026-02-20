"use client"
import { Cake } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function BirthdayWidget({ users }: { users: any[] }) {
    const today = new Date()
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0')
    const currentDay = today.getDate().toString().padStart(2, '0')

    // Helper to get day/month from string "MM-DD"
    const parseDate = (d?: string) => {
        if (!d) return { month: 99, day: 99 }
        const [m, day] = d.split('-').map(Number)
        return { month: m, day }
    }

    // Sort upcoming birthdays
    const upcomingBirthdays = users.filter(u => u.birthday).map(u => {
        const { month, day } = parseDate(u.birthday)
        let diff = (month * 31 + day) - (parseInt(currentMonth) * 31 + parseInt(currentDay))
        if (diff < 0) diff += 365 * 31 // wrap around year
        return { ...u, diff, month, day }
    }).sort((a, b) => a.diff - b.diff)

    const todaysBirthdays = upcomingBirthdays.filter(u => u.diff === 0)

    return (
        <Card className="bg-card/40 backdrop-blur-md border border-border/50 ring-1 ring-border shadow-sm h-[200px] flex flex-col group hover:shadow-md transition-all duration-500 overflow-hidden relative">
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-[#FF0C60]/10 to-transparent flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FF0C60] flex items-center justify-center shadow-lg shadow-[#FF0C60]/30">
                        <Cake className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-tight">Cumpleaños</h3>
                        <p className="text-[10px] text-muted-foreground font-medium">Próximas celebraciones</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <CardContent className="p-0 flex flex-col flex-1 divide-y divide-border/50 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {upcomingBirthdays.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 p-6">
                        <Cake className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs font-medium">Sin fechas próximas</span>
                    </div>
                ) : (
                    upcomingBirthdays.map(user => {
                        const isToday = user.diff === 0;
                        return (
                            <div key={user.id} className={`flex items-center gap-3 p-3 transition-colors ${isToday ? 'bg-[#FF0C60]/5' : 'hover:bg-muted/10'}`}>
                                <Avatar className={`w-8 h-8 border rounded-md shadow-sm ${isToday ? 'border-[#FF0C60] ring-2 ring-[#FF0C60]/20' : 'border-border'}`}>
                                    <AvatarImage src={user.image} />
                                    <AvatarFallback className="text-[10px] font-bold">{user.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-xs font-bold truncate ${isToday ? 'text-[#FF0C60]' : 'text-foreground'}`}>
                                        {user.name.split(' ')[0]} {user.name.split(' ')[1]?.[0]}.
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                        {isToday ? <span className="text-[#FF0C60] font-bold">¡Hoy!</span> :
                                            `${new Date(2000, user.month - 1, user.day).toLocaleString('es-CR', { month: 'long', day: 'numeric' })}`
                                        }
                                    </p>
                                </div>
                                {isToday && <Cake className="w-4 h-4 text-[#FF0C60]" />}
                            </div>
                        )
                    })
                )}
            </CardContent>

            {/* Confetti Effect (CSS only for now) */}
            {todaysBirthdays.length > 0 && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#FF0C60] to-yellow-500 animate-pulse" />
            )}
        </Card>
    )
}
