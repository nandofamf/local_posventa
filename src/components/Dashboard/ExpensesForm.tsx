import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function ExpensesForm() {
  const [category, setCategory] = useState("Compra de Productos");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast({ title: "Ingrese un monto válido", variant: "destructive" });
      return;
    }

    const newExpense = {
      type: "Gasto",
      category,
      description,
      amount: value,
      timestamp: Date.now(),
    };

    await push(ref(database, "expenses"), newExpense);
    toast({ title: "Gasto registrado correctamente" });
    setAmount("");
    setDescription("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border p-4 rounded-md bg-card shadow-sm"
    >
      <h3 className="font-semibold text-lg mb-2">Registrar Gasto</h3>

      <div className="space-y-1">
        <Label>Categoría</Label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-md px-2 py-1 w-full text-sm"
        >
          <option>Compra de Productos</option>
          <option>Arriendo</option>
          <option>Sueldo</option>
          <option>Otros</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label>Descripción</Label>
        <Input
          placeholder="Ej: Pago a proveedor"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Monto (CLP)</Label>
        <Input
          type="number"
          min="0"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">
        Guardar Gasto
      </Button>
    </form>
  );
}
