"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Calendar, Clock } from "lucide-react";

import usersData from "@/data/users.json";
import Link from "next/link";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export default function UsersPage() {
  const users = usersData.users;

  const getDepartmentColor = (department) => {
    switch (department.toLowerCase()) {
      case 'transmisión':
        return 'bg-blue-800 text-blue-100';
      case 'ingeniería':
        return 'bg-green-800 text-green-100';
      case 'operaciones':
        return 'bg-purple-800 text-purple-100';
      default:
        return 'bg-gray-700 text-gray-100';
    }
  };

  const getRoleColor = (role) => {
    if (role.toLowerCase().includes('supervisor') || role.toLowerCase().includes('coordinador')) {
      return 'bg-orange-800 text-orange-100';
    }
    return 'bg-blue-800 text-blue-100';
  };


  const glassCard = "bg-white/0 backdrop-blur-3xl border border-white/20 shadow-lg shadow-white/10 rounded-2xl";

  return (
    _jsx("div", { className: "min-h-screen p-4", style: { background: "hsl(240,10%,3.9%)" }, children:
      _jsxs("div", { className: "space-y-6 max-w-7xl mx-auto text-white", children: [


        _jsxs("div", { className: "flex items-center space-x-4", children: [
          _jsx(Link, { href: "/", children:
            _jsxs(Button, { variant: "outline", size: "sm", className: "border-white text-white hover:bg-white/10", children: [
              _jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Dashboard"] }

            ) }
          ),
          _jsxs("div", { children: [
            _jsx("h1", { className: "text-3xl font-bold", children: "Personal" }),
            _jsx("p", { className: "text-gray-300", children: "Equipo de trabajo de Enlace Canal 23" })] }
          )] }
        ),


        _jsxs(Card, { className: `${glassCard} text-white`, children: [
          _jsx(CardHeader, { children:
            _jsx(CardTitle, { children: "Perfiles Activos para crear un reporte para Control M\xE1ster." }) }
          ),
          _jsx(CardContent, { children:
            _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children:
              users.map((user) =>
              _jsx(Card, { className: `${glassCard} overflow-hidden`, children:
                _jsx(CardContent, { className: "p-6", children:
                  _jsxs("div", { className: "flex items-start space-x-4", children: [
                    _jsxs(Avatar, { className: "w-16 h-16", children: [
                      _jsx(AvatarImage, { src: user.avatar, alt: user.name }),
                      _jsx(AvatarFallback, { className: "text-lg", children:
                        user.name.split(' ').map((n) => n[0]).join('') }
                      )] }
                    ),

                    _jsxs("div", { className: "flex-1 min-w-0", children: [
                      _jsxs("div", { className: "flex items-start justify-between", children: [
                        _jsxs("div", { children: [
                          _jsx("h3", { className: "text-lg font-semibold truncate", children: user.name }),
                          _jsx(Badge, { className: getRoleColor(user.role), variant: "secondary", children:
                            user.role }
                          )] }
                        ),
                        _jsx("div", { className: `w-3 h-3 rounded-full ${user.active ? 'bg-green-400' : 'bg-gray-500'}`,
                          title: user.active ? 'Activo' : 'Inactivo' }
                        )] }
                      ),

                      _jsxs("div", { className: "mt-3 space-y-2", children: [
                        _jsxs("div", { className: "flex items-center text-sm text-gray-300", children: [
                          _jsx(Mail, { className: "w-4 h-4 mr-2 flex-shrink-0" }),
                          _jsx("span", { className: "truncate", children: user.email })] }
                        ),

                        _jsxs("div", { className: "flex items-center text-sm text-gray-300", children: [
                          _jsx(Clock, { className: "w-4 h-4 mr-2 flex-shrink-0" }),
                          _jsx("span", { className: "truncate", children: user.shift })] }
                        ),

                        _jsxs("div", { className: "flex items-center text-sm text-gray-300", children: [
                          _jsx(Calendar, { className: "w-4 h-4 mr-2 flex-shrink-0" }),
                          _jsxs("span", { children: ["Desde ", user.joinDate ? new Date(user.joinDate).toLocaleDateString('es-ES') : 'N/A'] })] }
                        )] }
                      ),

                      _jsx("div", { className: "mt-3", children:
                        _jsx(Badge, { className: getDepartmentColor(user.department || ''), variant: "outline", children:
                          user.department }
                        ) }
                      )] }
                    )] }
                  ) }
                ) }, user.id
              )
              ) }
            ) }
          )] }
        )] }



      ) }
    ));

}