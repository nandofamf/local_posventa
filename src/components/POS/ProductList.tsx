import React from "react";
import ProductFilters, { Product } from "@/components/ProductFilters";
import { Button } from "@/components/ui/button";

/**
 * Si ya tienes helpers como toCLP o handlers de agregar al carrito,
 * impórtalos y úsalos aquí. Dejé un fallback básico para CLP.
 */
const toCLP = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString("es-CL", { style: "currency", currency: "CLP" })
    : "$0";

/**
 * Props esperadas por tu listado actual.
 * - products: array de productos
 * - onAdd?: callback para agregar al carrito (opcional)
 */
type Props = {
  products: Product[];
  onAdd?: (p: Product) => void;
};

const ProductList: React.FC<Props> = ({ products, onAdd }) => {
  return (
    <div>
      {/* Toolbar + Filtros + Diálogo de bajo stock */}
      <ProductFilters products={products}>
        {({ filtered, isLowStock }) => (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="pos-card"
                onClick={() => onAdd?.(item)}
              >
                {/* Pill "Bajo" */}
                {isLowStock(item) && <span className="pos-low-pill">Bajo</span>}

                <div className="text-base font-semibold">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  Código: {item.barcode || "—"}
                </div>

                <div className="mt-2 text-primary font-bold">{toCLP(item.price)}</div>
                <div className="text-sm text-muted-foreground">
                  Stock: {item.stock ?? 0}
                </div>

                {onAdd && (
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(item);
                    }}
                  >
                    Agregar
                  </Button>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-6">
                No se encontraron productos.
              </p>
            )}
          </div>
        )}
      </ProductFilters>
    </div>
  );
};

export default ProductList;
