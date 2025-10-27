import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toCLP } from "@/lib/currency";
import { CartItem } from "@/types/product";

type PaymentMethod = "Efectivo" | "Tarjeta";

type Props = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  paymentMethod?: PaymentMethod | null;
  cashGiven?: number | undefined;
};

/* ===== Helpers ticket 58 mm ===== */
const WIDTH = 34;
const clamp = (s: string) => (s.length <= WIDTH ? s : s.slice(0, WIDTH));
const center = (s: string) => {
  const text = clamp(s);
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return " ".repeat(pad) + text;
};
const lr = (left: string, right: string) => {
  const L = clamp(left);
  const R = clamp(right);
  const spaces = Math.max(1, WIDTH - L.length - R.length);
  return clamp(L + " ".repeat(spaces) + R);
};
const line = (ch = "-") => ch.repeat(WIDTH);
/* ================================= */

const ReceiptDialog: React.FC<Props> = ({
  open,
  onClose,
  items,
  total,
  paymentMethod,
  cashGiven,
}) => {
  if (!open) return null;

  const efectivo = paymentMethod === "Efectivo" ? (cashGiven ?? 0) : 0;
  const cambio = paymentMethod === "Efectivo" ? Math.max(0, (cashGiven ?? 0) - total) : 0;

  const TITULO = "PRE-BOLETA";
  const EMPRESA = "OLAYO'S";
  const DIREC = "Maipú 470 - Local 15, Concepción";

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

    // Encabezado centrado
    L.push(center(TITULO));
    L.push(center(EMPRESA));
    L.push(center(DIREC));
    L.push(line("-"));
    L.push(center(fecha));
    L.push(line("="));

    // Productos
    items.forEach((it) => {
      const name = clamp((it.name || "").toLowerCase());
      const qtyUnit = `${it.quantity} x ${toCLP(it.price)}`;
      const totalItem = toCLP(it.price * it.quantity);

      L.push(lr(name, totalItem));   // producto ......... $TOTAL
      L.push("  " + clamp(qtyUnit)); //   1 x $2.500
      L.push(line("-"));
    });

    // Totales
    const totalItems = items.reduce((s, it) => s + it.quantity, 0);
    L.push(lr("NO. ARTICULOS:", String(totalItems)));
    L.push(lr("SUBTOTAL:", toCLP(total)));
    L.push(lr("TOTAL:", toCLP(total)));
    L.push(line("-"));

    // Pago
    const pagoCon = paymentMethod === "Efectivo" ? toCLP(efectivo) : "Tarjeta";
    L.push(lr("PAGO CON:", pagoCon));
    L.push(lr("SU CAMBIO:", toCLP(cambio)));
    L.push(line("="));
    L.push(center("¡GRACIAS POR SU COMPRA!"));

    // HTML final
    const html = `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Boleta</title>
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

  /* ✅ Fuente 9px y desplazamiento lateral 5mm */
  pre.ticket {
    width: 56mm;
    margin: 0 auto;
    padding: 0 0 0 5mm;         /* corre todo hacia la derecha */
    font-family: "Courier New", monospace;
    font-size: 9px;             /* tamaño de letra 9px */
    line-height: 1.05;
    font-weight: 700;
    white-space: pre;
    text-align: left;
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Boleta</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={handlePrint}>Imprimir</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDialog;
