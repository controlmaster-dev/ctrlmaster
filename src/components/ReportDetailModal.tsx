import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ReportSocials } from "@/components/ReportSocials";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User as UserIcon, Tag, Activity, Eye, ArrowLeft } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ReportDetailModal({ isOpen, onClose, report, currentUser, onUpdate }) {
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/users').
      then((res) => res.json()).
      then((data) => setUsers(data)).
      catch(console.error);
    }
  }, [isOpen]);

  const [fullReport, setFullReport] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && report) {
      setLoading(true);

      fetch(`/api/reports/${report.id}`).
      then((res) => res.json()).
      then((data) => {
        setFullReport(data);
      }).
      catch((err) => console.error("Failed to load report details", err)).
      finally(() => setLoading(false));


      if (currentUser) {
        fetch('/api/reports/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId: report.id, userId: currentUser.id })
        }).catch(console.error);
      }
    } else {
      setFullReport(null);
    }
  }, [isOpen, report, currentUser]);

  const displayReport = fullReport || report;

  if (!displayReport) return null;

  return (
    _jsx(Dialog, { open: isOpen, onOpenChange: onClose, children:
      _jsx(DialogContent, { onOpenAutoFocus: (e) => e.preventDefault(), className: "fixed !left-0 !top-0 !right-0 !bottom-0 !z-[50000] !w-[100vw] !h-[100dvh] !max-w-none !rounded-none !border-0 !translate-x-0 !translate-y-0 p-0 gap-0 bg-background/95 backdrop-blur-xl text-foreground shadow-none duration-300 md:!left-[50%] md:!top-[50%] md:!translate-x-[-50%] md:!translate-y-[-50%] md:!w-full md:!max-w-4xl md:!h-auto md:!max-h-[85vh] md:!rounded-3xl md:!border md:!border-border md:shadow-2xl overflow-hidden flex flex-col box-border ring-0 md:ring-1 md:ring-border", children:
        _jsxs("div", { className: "w-full h-full overflow-y-auto pb-32 md:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50", children: [

          _jsx("div", { tabIndex: 0, className: "sr-only", "aria-hidden": "true" }),
          _jsx(DialogHeader, { className: "p-4 md:p-0 bg-transparent border-b border-border md:border-none shadow-sm md:shadow-none relative mb-4 md:mb-0", children:
            _jsxs("div", { className: "flex items-center gap-4 pr-2", children: [

              _jsx("div", {
                onClick: onClose,
                className: "md:hidden p-2 -ml-2 rounded-full active:bg-muted text-muted-foreground cursor-pointer hover:text-foreground", children:

                _jsx(ArrowLeft, { className: "w-6 h-6" }) }
              ),

              _jsxs("div", { className: "flex-1 min-w-0", children: [
                _jsxs(DialogTitle, { className: "text-lg md:text-2xl font-bold flex items-center gap-4 truncate text-foreground", children: [
                  _jsxs("span", { children: ["Reporte #", displayReport.id.slice(0, 6)] }),
                  _jsx(Badge, { variant: "outline", className: "hidden sm:inline-flex font-normal border-border text-muted-foreground", children:
                    new Date(displayReport.createdAt).toLocaleDateString() }
                  )] }
                ),
                _jsx(DialogDescription, { className: "text-xs text-muted-foreground mt-1", children: "Detalles completos e historial de seguimiento." }

                )] }
              )] }
            ) }
          ),

          _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 md:p-0", children: [

            _jsxs("div", { className: "flex flex-col gap-6", children: [

              _jsxs("div", { className: "space-y-4", children: [
                _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                  _jsx(UserIcon, { className: "w-4 h-4 text-primary" }),
                  _jsx("span", { className: "font-medium text-foreground", children: displayReport.operatorName })] }
                ),
                _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                  _jsx(Tag, { className: "w-4 h-4 text-muted-foreground" }),
                  _jsx("span", { className: "capitalize", children: displayReport.category }),
                  _jsx("span", { className: "text-border", children: "|" }),
                  _jsx("span", { className: "", children: displayReport.priority })] }
                ),
                _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                  _jsx(Activity, { className: "w-4 h-4 text-emerald-500" }),
                  _jsx("span", { className: "capitalize", children: displayReport.status === 'resolved' ? 'Resuelto' : displayReport.status })] }
                )] }
              ),


              _jsx("div", { className: "border-t pt-4 border-border", children:
                loading ?
                _jsx("div", { className: "text-center py-4 text-muted-foreground text-xs", children: "Cargando comentarios..." }) :

                _jsx(ReportSocials, {
                  reportId: displayReport.id,
                  currentUser: currentUser,
                  initialComments: displayReport.comments || [],
                  initialReactions: displayReport.reactions || [],
                  availableUsers: users,
                  onUpdate: onUpdate }
                ) }

              )] }
            ),


            _jsxs("div", { className: "bg-muted/30 p-3 rounded-lg border border-border h-full", children: [
              _jsx("h4", { className: "text-xs font-bold text-muted-foreground mb-2", children: "Descripci\xF3n del problema" }),
              _jsx(ScrollArea, { className: "h-auto max-h-[500px] min-h-[200px] w-full rounded-md pr-4", children:
                _jsx("p", { className: "text-sm text-foreground leading-relaxed", children:
                  displayReport.problemDescription }
                ) }
              ),


              displayReport.attachments && displayReport.attachments.length > 0 &&
              _jsxs("div", { className: "mt-4 pt-4 border-t border-border", children: [
                _jsx("h4", { className: "text-xs font-bold text-muted-foreground mb-2", children: "Adjuntos" }),
                _jsx("div", { className: "flex gap-2 flex-wrap", children:

                  displayReport.attachments.map((file, idx) =>
                  _jsx("div", { className: "relative w-24 h-24 bg-card rounded-lg overflow-hidden border border-border flex items-center justify-center group cursor-pointer hover:border-ring transition-colors", onClick: () => {
                      const src = file.data || file.url;

                      if (src.startsWith('data:') || src.startsWith('http') || src.startsWith('/')) {
                        const win = window.open();
                        if (win) win.document.write('<iframe src="' + src + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                      }
                    }, children:
                    file.type === 'IMAGE' ?
                    _jsx("img", { src: file.data || file.url, alt: "Adjunto", className: "w-full h-full object-cover transition-transform group-hover:scale-105" }) :

                    _jsxs("div", { className: "flex flex-col items-center", children: [
                      _jsx("div", { className: "w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-1", children:
                        _jsx("div", { className: "w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-foreground border-b-[6px] border-b-transparent ml-1" }) }
                      ),
                      _jsx("span", { className: "text-[10px] text-muted-foreground", children: "Video" })] }
                    ) }, idx

                  )
                  ) }
                )] }
              )] }

            )] }
          ),


          displayReport.views && displayReport.views.length > 0 &&
          _jsxs("div", { className: "mt-4 flex items-center gap-2 text-[10px] text-muted-foreground", children: [
            _jsx(Eye, { className: "w-3 h-3" }),

            _jsxs("span", { children: ["Visto por: ", displayReport.views.map((v) => v.user.name).join(', ')] })] }
          )] }

        ) }
      ) }
    ));

}