"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity } from "lucide-react"

interface ActiveUser {
    id: string
    name: string
    image?: string
    role: string
    currentPath?: string
    lastActive?: string
}

interface ActiveUsersWidgetProps {
    users: ActiveUser[]
}

export function ActiveUsersWidget({ users }: ActiveUsersWidgetProps) {
    // Filter users active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const activeUsers = users.filter(u => {
        if (!u.lastActive) return false
        return new Date(u.lastActive) > fiveMinutesAgo
    })

    return (
        <Card className="bg-[#121214]/60 backdrop-blur-xl border-white/5 shadow-2xl rounded-3xl h-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Usuarios Activos ({activeUsers.length})
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-4">
                        {activeUsers.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                Nadie activo en este momento
                            </div>
                        ) : (
                            activeUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 border border-white/10">
                                            <AvatarImage src={user.image} />
                                            <AvatarFallback className="bg-slate-800 text-[10px]">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#121214] rounded-full animate-pulse"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                            <Badge variant="outline" className="text-[10px] h-4 border-white/10 text-slate-400 px-1 py-0">{user.role}</Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                                            <span className="text-emerald-400 font-medium">En: </span>
                                            {user.currentPath || '/'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
