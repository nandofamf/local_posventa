import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toCLP } from "@/lib/currency";

type Line = { text: string; amount: number | ""; id: string };

const formatTodayCL = () =>
  new Date().toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fmtDateInputToCL = (v: string) => {
  if (!v) return "";
  const d = new Date(v + "T00:00:00");
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

export default function WorkOrder() {
  const [dateIn] = useState<string>(formatTodayCL());
  const [deliverDate, setDeliverDate] = useState<string>("");
  const [client, setClient] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { id: crypto.randomUUID(), text: "", amount: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [abono, setAbono] = useState<number | "">("");

  const total = useMemo(
    () =>
      lines.reduce((s, l) => s + (typeof l.amount === "number" ? l.amount : 0), 0),
    [lines]
  );
  const saldo = useMemo(
    () => total - (typeof abono === "number" ? abono : 0),
    [total, abono]
  );

  const addLine = () =>
    setLines((l) => [...l, { id: crypto.randomUUID(), text: "", amount: "" }]);
  const removeLine = (id: string) =>
    setLines((l) => (l.length > 1 ? l.filter((x) => x.id !== id) : l));
  const updateLine = (id: string, key: keyof Line, value: string) =>
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              [key]:
                key === "amount"
                  ? value === ""
                    ? ""
                    : Number(value.replace(/\D/g, ""))
                  : value,
            }
          : l
      )
    );

  const clearAll = () => {
    setDeliverDate("");
    setClient("");
    setNotes("");
    setAbono("");
    setLines([{ id: crypto.randomUUID(), text: "", amount: "" }]);
  };

  /** ========== IMPRESIÓN HORIZONTAL CON LETRA 8.5px ========== */
 const handlePrintThermal = () => {
  const itemsHtml = lines
    .filter((l) => l.text.trim() !== "" || (l.amount as number) > 0)
    .map((l) => {
      const amount = typeof l.amount === "number" ? toCLP(l.amount) : toCLP(0);
      return `
        <div class="item-row">
          <span class="item-desc">${escapeHtml(l.text || "—")}</span>
          <span class="item-price">${amount}</span>
        </div>`;
    })
    .join("");

  const abonoCLP = toCLP(typeof abono === "number" ? abono : 0);
  const totalCLP = toCLP(total);
  const saldoCLP = toCLP(saldo);
  const todayStr = new Date().toLocaleDateString("es-CL");
  const deliverStr = fmtDateInputToCL(deliverDate) || "—";

  const html = `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Orden de Trabajo</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  html, body {
    margin: 0; width: 80mm; background: #fff; color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  * { box-sizing: border-box; }
  body, div, span { font-family: monospace; font-size: 10px; line-height: 1.33; }

  .viewport { position: relative; width: 80mm; }
  .rotate { position: absolute; left: 0; top: 0; transform-origin: top left; transform: rotate(90deg) translateY(-58mm); }

  .receipt { width: 58mm; padding: 8px 6px 8px 13.5mm; position: relative; }

  /* Nota vertical */
  .note-vert {
    position: absolute; left: 1.5mm; top: 8mm;
    writing-mode: vertical-rl; transform: rotate(180deg);
    font-size: 8.5px; text-align: center;
  }

  /* ===== Tres columnas: IZQ | GUTTER | DER (más ancha y más a la derecha) ===== */
  .cols {
    display: grid;
    grid-template-columns: 26mm 3mm 33mm;  /* 👉 derecha +1mm de ancho */
    column-gap: 0;
    align-items: start;
    position: relative;
  }

  /* Gutter con “-----” vertical y hueco para título */
  .sep { position: relative; }
  .sep::before {
    content: "";
    position: absolute; left: 50%; top: 0; bottom: 0; width: 0;
    background: repeating-linear-gradient(to bottom, #000 0 3mm, transparent 3mm 5mm);
    transform: translateX(-1px);
  }
  .sep .gap { position:absolute; left:0; right:0; top:14mm; height:14mm; background:#fff; }

  .center { text-align: center; }
  .muted  { color:#555; font-size: 8.5px; }
  .title  { font-weight: 900; font-size: 13px; margin: 0 0 2px; white-space: nowrap; }
  .sub    { font-weight: 700; font-size: 11px; margin: 0 0 4px; white-space: nowrap; }
  .small  { font-size: 8.5px; }
  .dash   { border-top: 1px dashed #000; margin: 6px 0; }

  .pair { display:flex; justify-content:space-between; gap:4px; margin: 4px 0; }
  .label{ font-weight:700; }
  .val  { text-align:right; white-space:nowrap; }

  /* ===== Caja DETALLE bien separada del gutter ===== */
  .right-title { font-weight:700; margin: 0 0 4px 3mm; text-align: left; } /* +1mm */
  .box {
    border: 1px dashed #000;
    padding: 4px 5px 6px 4px;   /* 👉 más padding a la derecha */
    margin-left: 3mm;           /* 👉 se despega del gutter */
  }

  .item-row   { display:flex; align-items: baseline; justify-content:space-between; gap:4px; margin: 3px 0; width:100%; }
  .item-desc  { flex: 1 1 auto; min-width: 0; padding-right: 2mm; white-space: pre-wrap; }
  .item-price {
    flex: 0 0 46px;           /* 👉 ancho fijo dentro de la caja */
    max-width: 46px;
    text-align: right;
    font-weight: 700;
    overflow: hidden;
  }

  /* Totales DENTRO de la caja */
  .box .hr  { border-top: 1px dashed #000; margin: 5px 0; }
  .box .row2 { display:flex; justify-content:space-between; margin: 2px 0; }
  .box .tot  { font-weight:900; }

  .feed { height: 6mm; }
</style>
</head>
<body onload="window.print(); setTimeout(()=>window.close(), 300)">
  <div class="viewport">
    <div class="rotate">
      <div class="receipt">

        <div class="note-vert"><b>* No se responde por trabajos pasados 90 días.</b></div>

        <div class="cols">
          <!-- IZQUIERDA -->
          <div>
            <div class="center">
              <div class="title">ORDEN DE TRABAJO</div>
              <div class="sub">OLAYO’S</div>
              <div class="small">Maipú 470 – Local 15, Concepción</div>
           
            </div>

            <div class="dash"></div>

            <div class="pair"><span class="label">Cliente</span><span class="val">${escapeHtml(client || "—")}</span></div>
            <div class="pair"><span class="label">Recibido</span><span class="val">${escapeHtml(formatTodayCL())}</span></div>
            <div class="pair"><span class="label">Entrega</span><span class="val"><b>${escapeHtml(deliverStr)}</b></span></div>
          </div>

          <!-- GUTTER -->
          <div class="sep"><div class="gap"></div></div>

          <!-- DERECHA -->
          <div>
            <div class="right-title"> Detalle</div>
            <div class="box">
              ${itemsHtml || ' <div class="muted">Sin detalle</div>'}
              <div class="hr"></div>
              <div class="row2"><span>Abono</span><span>${abonoCLP}</span></div>
              <div class="row2"><span class="tot">Total</span><span class="tot">${totalCLP}</span></div>
              <div class="row2"><span>Saldo</span><span>${saldoCLP}</span></div>
            </div>
          </div>
        </div>

        <div class="feed"></div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const w = window.open("", "print", "width=860,height=640");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
};





  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">ORDEN DE TRABAJO</h1>
        <div className="flex gap-2">
          <Button onClick={handlePrintThermal} className="bg-blue-600 hover:bg-blue-700">
            Imprimir Horizontal
          </Button>
          <Button variant="outline" onClick={clearAll}>
            Limpiar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Recibido</label>
              <input
                className="mt-1 w-full rounded-md border p-2 bg-muted/20"
                value={dateIn}
                disabled
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Entrega</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border p-2"
                value={deliverDate}
                onChange={(e) => setDeliverDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground">Cliente</label>
              <input
                className="mt-1 w-full rounded-md border p-2"
                placeholder="Nombre cliente"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>
          </div>

          {/* Detalle */}
          <div className="flex items-center justify-between">
            
            <button className="text-blue-600 text-sm" onClick={addLine} type="button">
              Agregar línea
            </button>
          </div>

          {lines.map((l) => (
            <div key={l.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
              <input
                className="md:col-span-5 rounded-md border p-2"
                placeholder="Ej: Costura costado, reforzar bolsillos..."
                value={l.text}
                onChange={(e) => updateLine(l.id, "text", e.target.value)}
              />
              <div className="flex gap-2 md:col-span-1">
                <input
                  className="w-full rounded-md border p-2 text-right"
                  placeholder="Valor"
                  value={l.amount === "" ? "" : l.amount}
                  onChange={(e) => updateLine(l.id, "amount", e.target.value)}
                />
                <button className="rounded-md border px-3 text-red-600" onClick={() => removeLine(l.id)}>
                  ×
                </button>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="text-sm text-muted-foreground">Observaciones</label>
              <textarea
                className="mt-1 w-full rounded-md border p-2 min-h-[100px]"
                placeholder="Notas adicionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="md:col-span-1 space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Abono</label>
                <input
                  className="mt-1 w-full rounded-md border p-2 text-right"
                  placeholder="0"
                  value={abono === "" ? "" : abono}
                  onChange={(e) =>
                    setAbono(
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value.replace(/\D/g, ""))
                    )
                  }
                />
              </div>

              <div className="rounded-md border p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{toCLP(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saldo</span>
                  <span className="font-semibold">{toCLP(saldo)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Escapar HTML */
function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[m];
  });
}
