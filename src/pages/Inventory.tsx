import { useState, useEffect } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Product } from "@/types/product";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { toCLP } from "@/lib/currency";

type FormState = {
  barcode: string;
  name: string;
  price: string;
  stock: string;
  minStock: string;
  category: string;
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);

  // diálogo de crear/editar
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormState>({
    barcode: "",
    name: "",
    price: "",
    stock: "",
    minStock: "",
    category: "",
  });

  // confirmación de eliminación
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      barcode: p.barcode ?? "",
      name: p.name ?? "",
      price: String(p.price ?? ""),
      stock: String(p.stock ?? ""),
      minStock: String(p.minStock ?? ""),
      category: p.category ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barcode || !formData.name || !formData.price) {
      toast({ title: "Faltan datos obligatorios", variant: "destructive" });
      return;
    }

    const productData: Omit<Product, "id"> = {
      barcode: formData.barcode.trim(),
      name: formData.name.trim(),
      price: Number(formData.price || 0),
      stock: Number(formData.stock || 0),
      minStock: Number(formData.minStock || 0),
      category: formData.category.trim(),
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
    } catch (err) {
      console.error(err);
      toast({ title: "No se pudo guardar el producto", variant: "destructive" });
    }
  };

  const askDelete = (p: Product) => {
    setProductToDelete(p);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete?.id) return;
    try {
      await remove(ref(database, `products/${productToDelete.id}`));
      toast({ title: "Producto eliminado" });
    } catch (err) {
      console.error(err);
      toast({ title: "No se pudo eliminar", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Inventario</h2>

        {/* Diálogo Crear/Editar */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreate}>
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
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de barras</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, barcode: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio (CLP)</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, price: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    inputMode="numeric"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, stock: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Stock mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    inputMode="numeric"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, minStock: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="submit">
                  {editingProduct ? "Guardar cambios" : "Guardar"}
                </Button>
              </div>
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
                <TableHead className="w-[160px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{toCLP(p.price)}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => askDelete(p)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AlertDialog global para eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará{" "}
              <b>{productToDelete?.name}</b> del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
