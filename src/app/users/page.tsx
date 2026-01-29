"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Mail, Calendar, Clock } from "lucide-react"
import { User } from "@/types"
import usersData from "@/data/users.json"
import Link from "next/link"

export default function UsersPage() {
  const users: User[] = usersData.users

  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case 'transmisión':
        return 'bg-blue-800 text-blue-100'
      case 'ingeniería':
        return 'bg-green-800 text-green-100'
      case 'operaciones':
        return 'bg-purple-800 text-purple-100'
      default:
        return 'bg-gray-700 text-gray-100'
    }
  }

  const getRoleColor = (role: string) => {
    if (role.toLowerCase().includes('supervisor') || role.toLowerCase().includes('coordinador')) {
      return 'bg-orange-800 text-orange-100'
    }
    return 'bg-blue-800 text-blue-100'
  }


  const glassCard = "bg-white/0 backdrop-blur-3xl border border-white/20 shadow-lg shadow-white/10 rounded-2xl"

  return (
    <div className="min-h-screen p-4" style={{ background: "hsl(240,10%,3.9%)" }}>
      <div className="space-y-6 max-w-7xl mx-auto text-white">


        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Personal</h1>
            <p className="text-gray-300">Equipo de trabajo de Enlace Canal 23</p>
          </div>
        </div>


        <Card className={`${glassCard} text-white`}>
          <CardHeader>
            <CardTitle>Perfiles Activos para crear un reporte para Control Máster.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <Card key={user.id} className={`${glassCard} overflow-hidden`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-lg">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold truncate">{user.name}</h3>
                            <Badge className={getRoleColor(user.role)} variant="secondary">
                              {user.role}
                            </Badge>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${user.active ? 'bg-green-400' : 'bg-gray-500'}`}
                            title={user.active ? 'Activo' : 'Inactivo'}>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center text-sm text-gray-300">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>

                          <div className="flex items-center text-sm text-gray-300">
                            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{user.shift}</span>
                          </div>

                          <div className="flex items-center text-sm text-gray-300">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Desde {user.joinDate ? new Date(user.joinDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Badge className={getDepartmentColor(user.department || '')} variant="outline">
                            {user.department}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>



      </div>
    </div>
  )
}
