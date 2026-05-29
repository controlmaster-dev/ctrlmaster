"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api/client";

type ResendEmail = {
  id: string;
  subject?: string;
  to?: string | string[];
  created_at: string;
  last_event: string;
};

type ResendHistoryResponse = {
  data?: ResendEmail[];
};

export function EmailHistoryCard() {
  const [emails, setEmails] = useState<ResendEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<ResendHistoryResponse>("/api/resend/history")
      .then((data) => {
        if (Array.isArray(data.data)) setEmails(data.data.slice(0, 5));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando historial...</p>;
  }

  if (emails.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No hay correos enviados recientemente.
      </p>
    );
  }

  return (
    <div className="overflow-hidden overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader className="border-b border-border bg-muted/20">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 pl-4 text-xs font-medium text-muted-foreground">
              Asunto
            </TableHead>
            <TableHead className="h-10 text-xs font-medium text-muted-foreground">
              Destinatario
            </TableHead>
            <TableHead className="h-10 text-xs font-medium text-muted-foreground">
              Fecha
            </TableHead>
            <TableHead className="h-10 pr-4 text-right text-xs font-medium text-muted-foreground">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <TableRow
              key={email.id}
              className="border-b border-border hover:bg-muted/20"
            >
              <TableCell className="py-3 pl-4 text-sm font-medium">
                {email.subject}
              </TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">
                {Array.isArray(email.to) ? email.to.join(", ") : email.to}
              </TableCell>
              <TableCell className="py-3 text-xs text-muted-foreground">
                {new Date(email.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="py-3 pr-4 text-right">
                <Badge
                  variant="outline"
                  className={
                    email.last_event === "delivered"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                      : email.last_event === "sent"
                        ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
                        : "border-border text-muted-foreground"
                  }
                >
                  {email.last_event === "delivered"
                    ? "Entregado"
                    : email.last_event === "sent"
                      ? "Enviado"
                      : email.last_event}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
