"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
        <Card className="bg-card/40 backdrop-blur-md border-border shadow-none rounded-md h-full ring-1 ring-border overflow-hidden">
            <CardHeader className="py-4 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2 tracking-tight">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Actividad reciente ({activeUsers.length})
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[252px]">
                    <div className="divide-y divide-border">
                        {activeUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                                <Activity className="w-8 h-8 opacity-20" />
                                <p className="text-xs font-medium tracking-tight">Sin actividad</p>
                            </div>
                        ) : (
                            activeUsers.map(user => (
                                <div key={user.id} className="group flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 border border-border shadow-sm rounded-md">
                                            <AvatarImage src={user.image} className="rounded-md" />
                                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-[10px] rounded-md">
                                                {user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-background rounded-full shadow-sm"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-muted-foreground truncate tracking-tight">
                                                {user.currentPath === '/' ? 'Inicio' : user.currentPath?.replace('/', '') || 'Navegando'}
                                            </span>
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
