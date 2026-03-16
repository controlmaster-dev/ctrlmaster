
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Plus, X } from "lucide-react";import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const DEFAULT_RECIPIENTS = ['rjimenez@enlace.org', 'ingenieria@enlace.org'];

export function EmailSendModal({
  isOpen,
  onClose,
  onConfirm,
  reportId,
  title = "Enviar Reporte por Correo"
}) {
  const [useDefaults, setUseDefaults] = useState(true);
  const [customEmails, setCustomEmails] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const handleAddEmail = () => {
    if (inputValue && inputValue.includes('@')) {
      setCustomEmails([...customEmails, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveEmail = (email) => {
    setCustomEmails(customEmails.filter((e) => e !== email));
  };

  const handleConfirm = () => {
    let finalRecipients = [];
    if (useDefaults) finalRecipients = [...DEFAULT_RECIPIENTS];
    finalRecipients = [...finalRecipients, ...customEmails];


    finalRecipients = Array.from(new Set(finalRecipients));

    onConfirm(finalRecipients);
    onClose();
  };

  return (
    _jsx(Dialog, { open: isOpen, onOpenChange: onClose, children:
      _jsxs(DialogContent, { className: "sm:max-w-[500px] bg-background border-border text-foreground", children: [
        _jsxs(DialogHeader, { children: [
          _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            _jsx("div", { className: "w-10 h-10 rounded-full bg-[#FF0C60]/10 text-[#FF0C60] flex items-center justify-center", children:
              _jsx(Mail, { className: "w-5 h-5" }) }
            ),
            _jsx(DialogTitle, { className: "text-xl font-bold text-foreground", children: title })] }
          ),
          _jsxs(DialogDescription, { className: "text-muted-foreground", children: ["Configura los destinatarios para el reporte ",
            _jsxs("span", { className: "text-foreground font-mono font-bold", children: ["#", reportId.slice(0, 6)] }), "."] }
          )] }
        ),

        _jsxs("div", { className: "py-4 space-y-6", children: [

          _jsxs("div", { className: "flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30", children: [
            _jsx(Checkbox, {
              id: "defaults",
              checked: useDefaults,
              onCheckedChange: (c) => setUseDefaults(c),
              className: "mt-1 data-[state=checked]:bg-[#FF0C60] border-muted-foreground" }
            ),
            _jsxs("div", { className: "grid gap-1.5 leading-none", children: [
              _jsx(Label, { htmlFor: "defaults", className: "text-sm font-medium text-foreground cursor-pointer", children: "Enviar a Ingenier\xEDa (Default)" }

              ),
              _jsx("p", { className: "text-xs text-muted-foreground", children:
                DEFAULT_RECIPIENTS.join(", ") }
              )] }
            )] }
          ),


          _jsxs("div", { className: "space-y-3", children: [
            _jsx(Label, { className: "text-xs font-bold text-muted-foreground tracking-tight", children: "Otros destinatarios" }),
            _jsxs("div", { className: "flex gap-2", children: [
              _jsx(Input, {
                value: inputValue,
                onChange: (e) => setInputValue(e.target.value),
                placeholder: "ejemplo@enlace.org",
                className: "bg-background border-border text-foreground focus-visible:ring-[#FF0C60]",
                onKeyDown: (e) => e.key === 'Enter' && handleAddEmail() }
              ),
              _jsx(Button, {
                onClick: handleAddEmail,
                size: "icon",
                variant: "secondary",
                disabled: !inputValue.includes('@'),
                className: "shrink-0", children:

                _jsx(Plus, { className: "w-4 h-4" }) }
              )] }
            ),


            customEmails.length > 0 &&
            _jsx("div", { className: "flex flex-wrap gap-2 mt-2", children:
              customEmails.map((email) =>
              _jsxs("div", { className: "flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-muted border border-border text-xs text-foreground", children: [
                _jsx("span", { children: email }),
                _jsx("button", { onClick: () => handleRemoveEmail(email), className: "p-1 hover:text-[#FF0C60] rounded-full transition-colors", children:
                  _jsx(X, { className: "w-3 h-3" }) }
                )] }, email
              )
              ) }
            )] }

          )] }
        ),

        _jsxs(DialogFooter, { className: "flex gap-2 sm:gap-0", children: [
          _jsx(Button, {
            variant: "ghost",
            onClick: onClose,
            className: "hover:bg-muted text-muted-foreground hover:text-foreground", children:
            "Cancelar" }

          ),
          _jsx(Button, {
            onClick: handleConfirm,
            className: "bg-[#FF0C60] hover:bg-[#D90A50] text-white font-bold min-w-[100px]",
            disabled: !useDefaults && customEmails.length === 0, children:
            "Enviar" }

          )] }
        )] }
      ) }
    ));

}