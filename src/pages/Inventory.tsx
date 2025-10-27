import { useState, useEffect } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Product } from "@/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { toCLP } from "@/lib/currency";

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    price: "",
    stock: "",
    minStock: "",
    category: "",
  });

  useEffect(() => {
    const productsRef = ref(database, "products");
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Product> | null;
      if (data) {
        const productList: Product[] = Object.entries(data).map(([id, p]) => ({
          ...(p as Product),
          id,
        }));
        setProducts(productList);
      } else {
        setProducts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      barcode: "",
      name: "",
      price: "",
      stock: "",
      minStock: "",
      category: "",
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barcode || !formData.name || !formData.price) return;

    const productData: Omit<Product, "id"> = {
      barcode: formData.barcode,
      name: formData.name,
      price: parseInt(formData.price),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock),
      category: formData.category,
    };

    try {
      if (editingProduct) {
        await update(ref(database, `products/${editingProduct.id}`), productData);
        toast({ title: "Producto actualizado" });
      } else {
        await push(ref(database, "products"), productData);
        toast({ title: "Producto agregado" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Inventario</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Producto" : "Agregar Producto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Label>Código de barras</Label>
              <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Label>Precio (CLP)</Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              <Label>Stock</Label>
              <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              <Label>Stock mínimo</Label>
              <Input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{toCLP(p.price)}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditingProduct(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => remove(ref(database, `products/${p.id}`))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
