// Formatea a Pesos Chilenos (sin decimales)
export const toCLP = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  } catch {
    return `$${Math.round(n).toLocaleString("es-CL")}`;
  }
};

// (opcional) parsea strings como "$12.345" → 12345
export const parseCLP = (str: string) =>
  Number(String(str).replace(/[^\d-]/g, "")) || 0;
