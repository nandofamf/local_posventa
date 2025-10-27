import { useState, useEffect } from "react";
import { ref, onValue, set, update, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Product, CartItem } from "@/types/product";
import { BarcodeScanner } from "@/components/POS/BarcodeScanner";
import Cart from "@/components/POS/Cart";
import { ProductList } from "@/components/POS/ProductList";
import ReceiptDialog from "@/components/POS/ReceiptDialog";
import { toast } from "@/hooks/use-toast";

type PaymentMethod = "Efectivo" | "Tarjeta";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);

  // pago actual
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashGiven, setCashGiven] = useState<number | undefined>(undefined);

  // Cargar productos
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

  // Inicializa productos por defecto
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

  // Escanear código
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

  // Agregar producto al carrito
  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast({
          title: "Stock insuficiente",
          description: `No hay más unidades de ${product.name}`,
          variant: "destructive",
        });
        return;
      }
      setCart(cart.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({ title: "Producto agregado", description: `${product.name} añadido al carrito` });
  };

  // Actualizar cantidad
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    const product = products.find((p) => p.id === id);
    if (product && quantity > product.stock) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${product.stock} unidades disponibles`,
        variant: "destructive",
      });
      return;
    }
    setCart(cart.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  // Eliminar producto
  const removeFromCart = (id: string) => {
    setCart(cart.filter((i) => i.id !== id));
    toast({ title: "Producto eliminado", description: "Se eliminó el producto del carrito" });
  };

  // Cobrar venta
  const handleCheckout = async (method: PaymentMethod, cash?: number) => {
    if (cart.length === 0) {
      toast({ title: "Carrito vacío", description: "Agrega productos antes de cobrar", variant: "destructive" });
      return;
    }

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (method === "Efectivo" && (cash ?? 0) < total) {
      toast({ title: "Monto insuficiente", description: "El efectivo entregado es menor al total", variant: "destructive" });
      return;
    }

    setPaymentMethod(method);
    setCashGiven(cash);

    const now = new Date();

    // ✅ Construcción de objeto payment sin undefined
    const paymentBase = {
      method,
      change: method === "Efectivo" ? Math.max(0, (cash ?? 0) - total) : 0,
    };
    const payment = method === "Efectivo"
      ? { ...paymentBase, cashGiven: cash ?? 0 }
      : paymentBase;

    interface SaleData {
      items: CartItem[];
      total: number;
      date: string;
      timestamp: number;
      payment: typeof payment;
    }

    const saleData: SaleData = {
      items: cart,
      total,
      date: now.toLocaleString("es-CL"),
      timestamp: now.getTime(),
      payment,
    };

    const updates: Record<string, number> = {};
    cart.forEach((item) => {
      updates[`products/${item.id}/stock`] = item.stock - item.quantity;
    });

    try {
      await update(ref(database), updates);
      await push(ref(database, "sales"), saleData); // ✅ ya no hay undefined
      setShowReceipt(true);
      toast({ title: "Venta procesada", description: "Boleta generada exitosamente" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo procesar la venta", variant: "destructive" });
    }
  };

  // Cerrar recibo
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
          <ProductList products={products} onAddToCart={addToCart} />
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
