import { useState, useEffect } from "react";
import { ref, onValue, update, push, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Product, CartItem } from "@/types/product";
import { BarcodeScanner } from "@/components/POS/BarcodeScanner";
import Cart from "@/components/POS/Cart";
import ProductList from "@/components/POS/ProductList";
import ReceiptDialog from "@/components/POS/ReceiptDialog";
import { toast } from "@/hooks/use-toast";
import AddCustomProduct from "@/components/POS/AddCustomProduct";

type PaymentMethod = "Efectivo" | "Tarjeta";

type CustomCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isCustom: true;
};

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashGiven, setCashGiven] = useState<number | undefined>(undefined);

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
        initializeSampleProducts();
      }
    });
    return () => unsubscribe();
  }, []);

  const initializeSampleProducts = async () => {
    const sampleProducts: Record<string, Omit<Product, "id">> = {
      "1": {
        barcode: "7501234567890",
        name: "Coca Cola 600ml",
        price: 1500,
        stock: 50,
        minStock: 10,
        category: "Bebidas",
      },
      "2": {
        barcode: "7501234567891",
        name: "Pan Blanco",
        price: 800,
        stock: 30,
        minStock: 15,
        category: "Panadería",
      },
      "3": {
        barcode: "4104480705199",
        name: "Abrillar",
        price: 20000,
        stock: 10,
        minStock: 2,
        category: "Servicios",
      },
    };
    await set(ref(database, "products"), sampleProducts);
  };

  const handleScan = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    if (!product) {
      toast({
        title: "Producto no encontrado",
        description: `No se encontró el código de barras: ${barcode}`,
        variant: "destructive",
      });
      return;
    }
    if (product.stock <= 0) {
      toast({
        title: "Sin stock",
        description: `${product.name} está agotado`,
        variant: "destructive",
      });
      return;
    }
    addToCart(product);
  };

  const addToCart = (product: Product | CustomCartItem) => {
    const isCustom = "isCustom" in product && product.isCustom === true;

    if (!isCustom) {
      const p = product as Product;
      const existing = cart.find((i) => i.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) {
          toast({
            title: "Stock insuficiente",
            description: `No hay más unidades de ${p.name}`,
            variant: "destructive",
          });
          return;
        }
        setCart(
          cart.map((i) =>
            i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
      } else {
        setCart([...cart, { ...p, quantity: 1 }]);
      }
      toast({ title: "Producto agregado", description: `${p.name} añadido al carrito` });
      return;
    }

    const c = product as CustomCartItem;
    const qty = Number(c.quantity) || 1;
    const existing = cart.find((i) => i.id === c.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === c.id ? { ...i, quantity: i.quantity + qty } : i)));
    } else {
      const customItem: CartItem = {
        id: c.id,
        name: c.name,
        price: c.price,
        quantity: qty,
        barcode: c.id,
        stock: Number.MAX_SAFE_INTEGER,
        minStock: 0,
        category: "Servicios",
      } as CartItem;
      setCart([...cart, customItem]);
    }
    toast({ title: "Servicio agregado", description: `${c.name} añadido al carrito` });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    const product = products.find((p) => p.id === id);
    if (product) {
      if (quantity > product.stock) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${product.stock} unidades disponibles`,
          variant: "destructive",
        });
        return;
      }
    }
    setCart(cart.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((i) => i.id !== id));
    toast({ title: "Producto eliminado", description: "Se eliminó el producto del carrito" });
  };

  const handleCheckout = async (method: PaymentMethod, cash?: number) => {
    if (cart.length === 0) {
      toast({ title: "Carrito vacío", description: "Agrega productos antes de cobrar", variant: "destructive" });
      return;
    }

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (method === "Efectivo" && (cash ?? 0) < total) {
      toast({
        title: "Monto insuficiente",
        description: "El efectivo entregado es menor al total",
        variant: "destructive",
      });
      return;
    }

    setPaymentMethod(method);
    setCashGiven(cash);

    const now = new Date();
    const payment = {
      method,
      cashGiven: cash ?? 0,
      change: method === "Efectivo" ? Math.max(0, (cash ?? 0) - total) : 0,
    };

    const saleData = {
      items: cart,
      total,
      date: now.toLocaleString("es-CL"),
      timestamp: now.getTime(),
      payment,
    };

    const updates: Record<string, number> = {};
    cart.forEach((item) => {
      const prod = products.find((p) => p.id === item.id);
      if (prod) {
        updates[`products/${item.id}/stock`] = Math.max(0, prod.stock - item.quantity);
      }
    });

    try {
      if (Object.keys(updates).length > 0) await update(ref(database), updates);
      await push(ref(database, "sales"), saleData);
      setShowReceipt(true);
      toast({ title: "Venta procesada", description: "Boleta generada exitosamente" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo procesar la venta", variant: "destructive" });
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCart([]);
    setPaymentMethod(null);
    setCashGiven(undefined);
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="w-full p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BarcodeScanner onScan={handleScan} />
          <ProductList products={products} onAdd={addToCart} />
          <AddCustomProduct onAdd={addToCart} />
        </div>

        <div className="lg:col-span-1">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      <ReceiptDialog
        open={showReceipt}
        onClose={handleCloseReceipt}
        items={cart}
        total={total}
        paymentMethod={paymentMethod}
        cashGiven={cashGiven}
      />
    </div>
  );
};

export default Index;
