import React, { useMemo, useState } from "react";
import { CartItem } from "@/types/product";
import { toCLP } from "@/lib/currency";
import { Button } from "@/components/ui/button";

type Props = {
  items: CartItem[];
  onUpdateQuantity: (id: string, q: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (paymentMethod: "Efectivo" | "Tarjeta", cashGiven?: number) => void;
};

const Cart: React.FC<Props> = ({ items, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const [showCashInput, setShowCashInput] = useState(false);
  const [cashGivenStr, setCashGivenStr] = useState("");
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const cashGiven = Number(cashGivenStr.replace(/\D/g, "")) || 0;
  const change = Math.max(0, cashGiven - subtotal);

  const handlePayCash = () => {
    setError(null);
    if (!items.length) return setError("No hay productos en el carrito.");
    if (cashGiven < subtotal) return setError("El monto entregado es menor al total.");
    onCheckout("Efectivo", cashGiven);
    setCashGivenStr("");
    setShowCashInput(false);
  };

  const handlePayCard = () => {
    setError(null);
    if (!items.length) return setError("No hay productos en el carrito.");
    onCheckout("Tarjeta"); // ✅ dispara correctamente
  };

  return (
    <div className="bg-white/80 dark:bg-zinc-900/70 rounded-2xl shadow-lg border border-zinc-200/60 dark:border-zinc-800/60 p-5 space-y-4">
      <h3 className="text-lg font-bold">Carrito de Compra</h3>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay productos en el carrito</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 max-h-[280px] overflow-y-auto pr-1">
          {items.map((it) => (
            <li key={it.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{it.name}</p>
                <p className="text-xs text-zinc-500">Código: {it.barcode}</p>
                <p className="text-xs text-zinc-500">
                  {toCLP(it.price)} × {it.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    onUpdateQuantity(it.id, Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-14 h-8 text-center border rounded-md"
                />
                <button
                  type="button"
                  onClick={() => onRemoveItem(it.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between items-center border-t pt-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Total:</span>
        <span className="text-xl font-extrabold">{toCLP(subtotal)}</span>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          className="rounded-lg font-semibold bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowCashInput((s) => !s)}
        >
          Pagar en Efectivo
        </Button>

        <Button
          type="button" // ⭐ evita que actúe como submit
          className="rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
          onClick={handlePayCard}
        >
          Pagar con Tarjeta
        </Button>
      </div>

      {showCashInput && (
        <div className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
          <label className="block text-sm font-medium">Monto entregado</label>
          <input
            value={cashGivenStr}
            onChange={(e) => setCashGivenStr(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Ej: 20000"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex justify-between text-sm border-t pt-2">
            <span>PAGO CON:</span>
            <span className="font-medium">{toCLP(cashGiven)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>SU CAMBIO:</span>
            <span className="font-medium">{toCLP(change)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button
              type="button"
              onClick={handlePayCash}
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              Confirmar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCashInput(false);
                setCashGivenStr("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
