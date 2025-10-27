import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toCLP } from "@/lib/currency";

type CashClosingData = {
  todayCount: number;
  cashToday: number;
  cardToday: number;
  totalToday: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: CashClosingData;
};

/* ===== Helpers ticket 58 mm ===== */
const WIDTH = 34;
const clamp = (s: string) => (s.length <= WIDTH ? s : s.slice(0, WIDTH));
const lr = (l: string, r: string) => {
  const spaces = Math.max(1, WIDTH - l.length - r.length);
  return clamp(l + " ".repeat(spaces) + r);
};
const center = (s: string) => {
  const text = clamp(s);
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return " ".repeat(pad) + text;
};
const line = (ch = "-") => ch.repeat(WIDTH);
/* ================================= */

const CashClosingDialog: React.FC<Props> = ({ open, onClose, data }) => {
  const { todayCount, cashToday, cardToday, totalToday } = data;

  const handlePrint = () => {
    const now = new Date();
    const fecha = now.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const L: string[] = [];
    L.push(center("CIERRE DE CAJA"));
    L.push(line("-"));
    L.push(center(fecha));
    L.push(line("="));
    L.push(lr("TRANSACCIONES DEL DÍA:", String(todayCount)));
    L.push(line("-"));
    L.push(lr("VENTAS EFECTIVO:", toCLP(cashToday)));
    L.push(lr("VENTAS TARJETA:", toCLP(cardToday)));
    L.push(line("-"));
    L.push(lr("TOTAL VENTAS:", toCLP(totalToday)));
    L.push(line("="));
    L.push(center("¡GRACIAS!"));

    const html = `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Cierre de Caja</title>
<style>
  @page { size: 58mm auto; margin: 0; }

  html, body {
    margin: 0;
    padding: 0;
    width: 58mm;
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
  }

  .paper {
    width: 58mm;
    margin: 0 auto;
  }

  /* Margen izq. y centrado óptico; fuente 8px compacta */
  pre.ticket {
    width: 56mm;              /* seguridad para márgenes físicos */
    margin: 0 auto;
    padding: 0 0 0 1.5mm;     /* empuja un poco a la derecha */
    font-family: "Courier New", monospace;
    font-size: 8px;           /* ✅ tamaño solicitado */
    line-height: 1.0;         /* muy compacto */
    font-weight: 700;
    white-space: pre;
    text-align: center;       /* centra visualmente el bloque */
    text-rendering: geometricPrecision;
  }
</style>
</head>
<body onload="window.print(); setTimeout(()=>window.close(), 250)">
  <div class="paper">
    <pre class="ticket">${L.join("\n")}</pre>
  </div>
</body>
</html>`.trim();

    const w = window.open("", "print", "width=320,height=600,left=200,top=200");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cierre de Caja</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Transacciones del día</span>
            <span className="font-medium">{todayCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Ventas en Efectivo</span>
            <span className="font-medium">{toCLP(cashToday)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ventas con Tarjeta</span>
            <span className="font-medium">{toCLP(cardToday)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-base">
            <span className="font-semibold">Total vendido</span>
            <span className="font-semibold">{toCLP(totalToday)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handlePrint}>Cerrar e Imprimir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashClosingDialog;
