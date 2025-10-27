import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const ProductList = ({ products, onAddToCart }: ProductListProps) => {
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);

  return (
    <div className="space-y-4">
      {lowStockProducts.length > 0 && (
        <Alert variant="destructive" className="bg-warning/10 border-warning text-warning-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lowStockProducts.length} producto(s) con stock bajo
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Productos Disponibles</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-auto">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => product.stock > 0 && onAddToCart(product)}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {product.name}
                  </h3>
                  {product.stock <= product.minStock && (
                    <Badge variant={product.stock === 0 ? "destructive" : "secondary"} className="ml-2">
                      {product.stock === 0 ? "Agotado" : "Bajo"}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-1">
                  Código: {product.barcode}
                </p>
                
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className={`text-sm font-medium ${
                      product.stock <= product.minStock 
                        ? 'text-warning' 
                        : 'text-accent'
                    }`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};
