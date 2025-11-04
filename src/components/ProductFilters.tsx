import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TriangleAlert } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  barcode?: string;
  price?: number;
  stock?: number;
  minStock?: number;
};

type RenderArgs = {
  filtered: Product[];
  isLowStock: (p: Product) => boolean;
  lowStockProducts: Product[];
};

type Props = {
  products: Product[];
  children: (args: RenderArgs) => React.ReactNode;
};

export default function ProductFilters({ products, children }: Props) {
  const [search, setSearch] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const isLowStock = (p: Product) =>
    typeof p.stock === "number" &&
    typeof p.minStock === "number" &&
    p.stock <= p.minStock;

  const lowStockProducts = useMemo(() => products.filter(isLowStock), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products;
    if (q) {
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          String(p.barcode || "").toLowerCase().includes(q)
      );
    }
    if (onlyLowStock) list = list.filter(isLowStock);
    return list;
  }, [products, search, onlyLowStock]);

  return (
    <>
      {/* Toolbar */}
      <div className="pos-toolbar">
        <div className="pos-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto por nombre o código…"
            className="pos-search-input pos-input"
          />
          {search && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={onlyLowStock ? "default" : "outline"}
            onClick={() => setOnlyLowStock((v) => !v)}
            className="whitespace-nowrap"
          >
            {onlyLowStock ? "Mostrando bajo stock" : "Ver bajo stock"}
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-xs font-semibold">
              {lowStockProducts.length}
            </span>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="whitespace-nowrap">
                <TriangleAlert className="mr-2 h-4 w-4" />
                Detalle bajo stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Productos con stock bajo ({lowStockProducts.length})
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay productos bajo el mínimo.
                  </p>
                ) : (
                  lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-muted-foreground truncate">
                          Código: {p.barcode || "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div>
                          Stock: <b>{p.stock}</b>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Mín: {p.minStock ?? "—"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {children({ filtered, isLowStock, lowStockProducts })}
    </>
  );
}
