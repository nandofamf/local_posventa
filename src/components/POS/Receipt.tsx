import { forwardRef } from 'react';
import { CartItem } from '@/types/product';
import { Separator } from '@/components/ui/separator';

interface ReceiptProps {
  items: CartItem[];
  total: number;
  date: string;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ items, total, date }, ref) => {
    return (
      <div ref={ref} className="bg-white p-8 max-w-md mx-auto text-black">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">PRE-BOLETA</h1>
          <h1 className="text-2xl font-bold">Olayo's</h1>
          <p className="text-sm text-gray-600 mt-2">{date}</p>
          <p className="text-sm text-gray-600 mt-2">Maipu 470, local 15, Concepción</p>
        </div>

        <Separator className="mb-4 bg-black" />

        <div className="space-y-3 mb-4">
          {items.map((item, index) => (
            <div key={index} className="text-sm">
              <div className="flex justify-between font-semibold">
                <span>{item.name}</span>
                <span>
                  ${ (item.price * item.quantity).toLocaleString("es-CL") }
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs">
                <span>
                  {item.quantity} x ${ item.price.toLocaleString("es-CL") }
                </span>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4 bg-black" />

        <div className="space-y-2 mb-6">
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL:</span>
            <span>${ total.toLocaleString("es-CL") }</span>
          </div>
        </div>

        <Separator className="my-4 bg-black" />

        <div className="text-center text-xs text-gray-600">
          <p>¡Gracias por su compra!</p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
