// product.ts
export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  timestamp: number;
}

// NUEVA INTERFAZ AÑADIDA
export interface ClientData {
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
}