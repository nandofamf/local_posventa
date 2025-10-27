import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Scan } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on the input
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcode.trim()) {
      onScan(barcode.trim());
      setBarcode('');
    }
  };

  return (
    <Card className="p-6 shadow-md">
      <div className="flex items-center gap-3">
        <Scan className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Escanear Código de Barras
          </label>
          <Input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escanee el código o escríbalo..."
            className="font-mono"
          />
        </div>
      </div>
    </Card>
  );
};
