import { CartItem, Sale } from "@/types/product";

/**
 * Función conceptual para generar la estructura básica de un XML de Documento Tributario Electrónico (DTE).
 * NOTA: Este XML NO ES OFICIALMENTE VÁLIDO NI ESTÁ FIRMADO.
 */
export function generateDTEXml(sale: Omit<Sale, 'id'>, saleId: string) {
  
  // 1. Crear el bloque XML de los ítems
  const itemsXML = sale.items.map((item, index) => `
    <Detalle>
      <NroLinDet>${index + 1}</NroLinDet>
      <NmbItem>${escapeXml(item.name)}</NmbItem>
      <QtyItem>${item.quantity}</QtyItem>
      <PrcItem>${item.price}</PrcItem>
      <MontoItem>${item.price * item.quantity}</MontoItem>
    </Detalle>
  `).join('');

  // 2. Simular la estructura básica de un DTE (Boleta Electrónica tipo 39)
  const dteXML = `<?xml version="1.0" encoding="ISO-8859-1"?>
<EnvioDTE version="1.0">
  <SetDTE ID="SetDTE_${saleId}">
    <DTE ID="T39_${saleId}">
      <Documento ID="DTE_${saleId}">
        <Encabezado>
          <IdDoc>
            <TipoDTE>39</TipoDTE>
            <Folio>${saleId}</Folio>
            <FchEmis>${new Date().toISOString().split('T')[0]}</FchEmis>
          </IdDoc>
          <Emisor>
            <RUTEmisor>76883241-2</RUTEmisor>
            <RznSocEmisor>OLAYO'S</RznSocEmisor>
          </Emisor>
          <Totales>
            <MntTotal>${sale.total}</MntTotal>
          </Totales>
        </Encabezado>
        <Detalle>
          ${itemsXML}
        </Detalle>
      </Documento>
      </DTE>
  </SetDTE>
</EnvioDTE>`;
  
  return dteXML.trim();
}

// Función auxiliar para escapar caracteres especiales en el XML
function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}