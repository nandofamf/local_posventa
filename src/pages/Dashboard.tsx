// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { toCLP } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CashClosingDialog from "@/components/POS/CashClosingDialog";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/** Tipos locales para el Tooltip (compatibles con distintas versiones de Recharts) */
type TooltipValue = number | string;
type TooltipName = string | number;
type TooltipPayloadItem = {
  value: TooltipValue;
  dataKey?: string;
};
type SimpleTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
};

type PaymentMethod = "Efectivo" | "Tarjeta";

type SaleDto = {
  total?: number;
  timestamp?: number;
  payment?: {
    method?: PaymentMethod;
    cashGiven?: number;
    change?: number;
  };
};

type Sale = {
  id: string;
  total: number;
  timestamp: number;
  method: PaymentMethod | "Desconocido";
};

export default function Dashboard() {
  const [openClosing, setOpenClosing] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalAll, setTotalAll] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);

  // Totales del día por método
  const [todayCashTotal, setTodayCashTotal] = useState(0);
  const [todayCardTotal, setTodayCardTotal] = useState(0);

  useEffect(() => {
    const salesRef = ref(database, "sales");
    const unsub = onValue(salesRef, (snap) => {
      const data = snap.val() as Record<string, SaleDto> | null;
      if (!data) {
        setSales([]);
        setTotalAll(0);
        setTodayTotal(0);
        setTodayCashTotal(0);
        setTodayCardTotal(0);
        return;
      }

      const list: Sale[] = Object.entries(data).map(([id, s]) => ({
        id,
        total: Number(s?.total ?? 0),
        timestamp: Number(s?.timestamp ?? 0),
        method: (s?.payment?.method as PaymentMethod) ?? "Desconocido",
      }));

      setSales(list);
      setTotalAll(list.reduce((sum, s) => sum + s.total, 0));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = today.getTime();
      const end = new Date(today).setHours(23, 59, 59, 999);

      const todayList = list.filter(
        (s) => s.timestamp >= start && s.timestamp <= end
      );

      setTodayTotal(todayList.reduce((sum, s) => sum + s.total, 0));
      setTodayCashTotal(
        todayList
          .filter((s) => s.method === "Efectivo")
          .reduce((sum, s) => sum + s.total, 0)
      );
      setTodayCardTotal(
        todayList
          .filter((s) => s.method === "Tarjeta")
          .reduce((sum, s) => sum + s.total, 0)
      );
    });

    return () => unsub();
  }, []);

  const transactionsCount = sales.length;

  // Datos últimos 7 días (monto)
  const last7DaysData = useMemo(() => {
    const days: { date: string; ventas: number }[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const start = new Date(d);
      const end = new Date(d);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const dayTotal = sales
        .filter((s) => s.timestamp >= start.getTime() && s.timestamp <= end.getTime())
        .reduce((sum, s) => sum + s.total, 0);

      days.push({
        date: d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
        ventas: dayTotal,
      });
    }

    return days;
  }, [sales]);

  // Tooltip CLP
  const MoneyTooltip = ({ active, payload, label }: SimpleTooltipProps) => {
    if (active && payload && payload.length) {
      const first = payload[0];
      const raw = first?.value;
      const num =
        typeof raw === "number"
          ? raw
          : Number(typeof raw === "string" ? raw : 0);

      return (
        <div className="rounded-md border bg-card text-card-foreground p-2 text-xs shadow">
          <div className="font-medium">{String(label ?? "")}</div>
          <div>{toCLP(num)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Tarjetas (quitamos Ticket Promedio) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ventas del Día</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{toCLP(todayTotal)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Ventas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{toCLP(totalAll)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Transacciones</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{transactionsCount}</CardContent>
        </Card>
      </div>

      {/* Gráfico de los últimos 7 días + botón grande de cierre debajo */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas últimos 7 días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="ventas" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Botón grande, abajo del gráfico */}
          <div className="mt-6">
            <Button
              onClick={() => setOpenClosing(true)}
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              Cierre de Caja
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog cierre con desglose por método */}
      <CashClosingDialog
        open={openClosing}
        onClose={() => setOpenClosing(false)}
        data={{
          todayCount: sales.filter((s) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            const start = d.getTime();
            const end = new Date(d).setHours(23, 59, 59, 999);
            return s.timestamp >= start && s.timestamp <= end;
          }).length,
          totalToday: todayTotal,
          cashToday: todayCashTotal,
          cardToday: todayCardTotal,
        }}
      />
    </div>
  );
}
