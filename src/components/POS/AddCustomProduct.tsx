import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AddCustomProduct({
  onAdd,
}: {
  onAdd: (item: { id: string; name: string; price: number; quantity: number; isCustom: true }) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">(1);

  const handleAdd = () => {
    if (!name || !price) return;

    onAdd({
      id: `custom-${Date.now()}`,
      name,
      price: Number(price),
      quantity: Number(quantity) || 1,
      isCustom: true,
    });

    setName("");
    setPrice("");
    setQuantity(1);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Agregar producto personalizado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Nombre</Label>
            <Input
              placeholder="Ej: Arreglo floral o corte de tela"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label>Precio</Label>
            <Input
              type="number"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
        </div>
        <Button onClick={handleAdd} className="w-full mt-2">
          Agregar al carrito
        </Button>
      </CardContent>
    </Card>
  );
}
