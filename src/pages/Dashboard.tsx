// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Link } from "react-router-dom";

type SaleItem = { id: string; name: string; price: number; quantity: number };
type Sale = { date: number | string; items: SaleItem[]; total: number };
type ExpenseCategory = "Compra de Productos" | "Arriendo" | "Sueldo" | "Otros";
type Expense = { id: string; date: string; amount: number; category: ExpenseCategory; note?: string };

const todayISO = () => new Date().toISOString().slice(0, 10);
const ym = (d: string) => d.slice(0, 7);
const COLORS = ["#2563eb", "#ef4444", "#f59e0b", "#10b981", "#6b7280"];

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [openExp, setOpenExp] = useState(false);
  const [formExp, setFormExp] = useState<{ date: string; amount: string; category: ExpenseCategory; note: string }>({
    date: todayISO(),
    amount: "",
    category: "Compra de Productos",
    note: "",
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(todayISO().slice(0, 7));

  useEffect(() => {
    const sRef = ref(database, "sales");
    const unsubS = onValue(sRef, (snap) => {
      const list: Sale[] = [];
      snap.forEach((c) => {
        const v = c.val();
        list.push({
          date: typeof v?.date === "number" ? v.date : Number(v?.timestamp ?? Date.parse(v?.date ?? new Date())),
          items: Array.isArray(v?.items) ? v.items : [],
          total: Number(v?.total ?? 0),
        });
      });
      setSales(list);
    });

    const eRef = ref(database, "expenses");
    const unsubE = onValue(eRef, (snap) => {
      const list: Expense[] = [];
      snap.forEach((c) => {
        const v = c.val();
        if (v) {
          list.push({
            id: v.id ?? c.key!,
            date: typeof v.date === "string" ? v.date : todayISO(),
            amount: Number(v.amount ?? 0),
            category: (v.category as ExpenseCategory) ?? "Otros",
            note: typeof v.note === "string" ? v.note : "",
          });
        }
      });
      setExpenses(list);
    });

    return () => {
      unsubS();
      unsubE();
    };
  }, []);

  const yearMonths = useMemo(() => {
    const d = new Date();
    const arr: string[] = [];
    for (let i = 0; i < 12; i++) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      arr.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr.reverse();
  }, []);

  const salesOfMonth = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return sales.filter((s) => {
      const d = new Date(typeof s.date === "number" ? s.date : Date.parse(String(s.date)));
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [sales, selectedMonth]);

  const expensesOfMonth = useMemo(() => {
    const [yyyy, mm] = selectedMonth.split("-").map(Number);
    return expenses.filter((e) => {
      if (!e || typeof e.date !== "string" || e.date.length < 7) return false;
      const parts = e.date.split("-");
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (Number.isNaN(y) || Number.isNaN(m)) return false;
      return y === yyyy && m === mm;
    });
  }, [expenses, selectedMonth]);

  const daysData = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const base = Array.from({ length: days }, (_, i) => ({ day: i + 1, total: 0 }));
    for (const s of salesOfMonth) {
      const d = new Date(typeof s.date === "number" ? s.date : Date.parse(String(s.date)));
      const di = d.getDate() - 1;
      if (base[di]) base[di].total += Number(s.total ?? 0);
    }
    return base;
  }, [salesOfMonth, selectedMonth]);

  const totalSales = useMemo(() => salesOfMonth.reduce((a, b) => a + Number(b.total ?? 0), 0), [salesOfMonth]);
  const sumByCat = useMemo(() => {
    const acc: Record<ExpenseCategory, number> = {
      "Compra de Productos": 0,
      Arriendo: 0,
      Sueldo: 0,
      Otros: 0,
    };
    for (const e of expensesOfMonth) acc[e.category] += Number(e.amount ?? 0);
    return acc;
  }, [expensesOfMonth]);

  const totalExpenses = useMemo(() => Object.values(sumByCat).reduce((a, b) => a + b, 0), [sumByCat]);
  const pieData = useMemo(
    () => [
      { name: "Ventas", value: totalSales },
      { name: "Compra de Productos", value: sumByCat["Compra de Productos"] },
      { name: "Arriendo", value: sumByCat["Arriendo"] },
      { name: "Sueldo", value: sumByCat["Sueldo"] },
      { name: "Otros", value: sumByCat["Otros"] },
    ],
    [totalSales, sumByCat]
  );

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const s of salesOfMonth) {
      for (const it of s.items ?? []) {
        const prev = map.get(it.id) ?? { name: it.name, qty: 0 };
        prev.qty += Number(it.quantity || 0);
        map.set(it.id, prev);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [salesOfMonth]);

  const saveExpense = async () => {
    const amount = Number(formExp.amount);
    const dateStr = formExp.date?.toString() ?? "";
    if (!dateStr || amount <= 0 || dateStr.length < 7) return;
    const node = push(ref(database, "expenses"));
    const payload: Expense = {
      id: node.key || crypto.randomUUID(),
      date: dateStr,
      amount,
      category: formExp.category,
      note: formExp.note ?? "",
    };
    await set(node, payload);
    setOpenExp(false);
    setFormExp({ date: todayISO(), amount: "", category: "Compra de Productos", note: "" });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Barra superior */}
<div className="sticky top-0 z-[120] flex flex-wrap items-center gap-3 rounded-md bg-background/90 px-1 py-2 backdrop-blur">
  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
    <SelectTrigger className="w-[220px]">
      <SelectValue placeholder="Mes" />
    </SelectTrigger>

    {/* MENÚ con fondo sólido, sombra y z-index alto */}
    <SelectContent
      position="popper"
      side="bottom"
      align="start"
      sideOffset={8}
      collisionPadding={12}
      className="
        z-[130] w-[220px] 
        max-h-72 overflow-auto 
        rounded-md border shadow-xl 
        bg-white text-neutral-900 
        dark:bg-neutral-900 dark:text-neutral-100
      "
    >
      {yearMonths.map((m) => (
        <SelectItem key={m} value={m}>
          {new Date(m + '-01').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Button onClick={() => setOpenExp(true)}>Registrar gasto</Button>
  <Link to="/">
    <Button variant="secondary">Ir a Punto de Venta</Button>
  </Link>
</div>

      {/* Tarjetas principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Ventas del mes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">${totalSales.toLocaleString("es-CL")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos del mes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">${totalExpenses.toLocaleString("es-CL")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Utilidad</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${(totalSales - totalExpenses).toLocaleString("es-CL")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transacciones</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{salesOfMonth.length}</CardContent>
        </Card>
      </div>

      {/* Ventas por día */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas por día</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daysData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos inferiores */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos vs ventas</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top productos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between rounded-md border p-3">
                  <span className="truncate">{p.name}</span>
                  <span className="font-semibold">{p.qty}</span>
                </li>
              ))}
              {topProducts.length === 0 && <div className="text-sm text-muted-foreground">Sin ventas.</div>}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Modal registrar gasto */}
      <Dialog open={openExp} onOpenChange={setOpenExp}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar gasto</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formExp.date}
                  onChange={(e) => setFormExp((s) => ({ ...s, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Monto</Label>
                <Input
                  inputMode="numeric"
                  value={formExp.amount}
                  onChange={(e) => setFormExp((s) => ({ ...s, amount: e.target.value.replace(/[^\d]/g, "") }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoría</Label>
                <Select
                  value={formExp.category}
                  onValueChange={(v: ExpenseCategory) => setFormExp((s) => ({ ...s, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compra de Productos">Compra de Productos</SelectItem>
                    <SelectItem value="Arriendo">Arriendo</SelectItem>
                    <SelectItem value="Sueldo">Sueldo</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nota (opcional)</Label>
                <Input
                  value={formExp.note}
                  onChange={(e) => setFormExp((s) => ({ ...s, note: e.target.value }))}
                  placeholder="Detalle"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenExp(false)}>
              Cancelar
            </Button>
            <Button onClick={saveExpense}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
