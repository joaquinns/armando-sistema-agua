import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Tipos opcionales si usas TypeScript
type Venta = {
  pipas: number;
  referencia: string;
  precio_unitario: number;
};

type Gasto = {
  descripcion: string;
  monto: number;
};

export function generarPDFDelDia(
  ventas: Venta[],
  gastos: Gasto[],
  fecha: string
) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text("Resumen del día", 14, 15);
  doc.setFontSize(12);
  doc.text(`Fecha: ${fecha}`, 14, 22);

  // Tabla de ventas
  autoTable(doc, {
    startY: 25,
    head: [["Pipas", "Referencia", "Precio U.", "Total"]],
    body: ventas.map((venta) => [
      venta.pipas,
      venta.referencia,
      venta.precio_unitario.toFixed(2),
      (venta.pipas * venta.precio_unitario).toFixed(2),
    ]),
    theme: "grid",
    styles: { halign: "center" },
  });

  // Siguiente tabla (gastos)
  const nextY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: nextY,
    head: [["Descripción", "Monto"]],
    body: gastos.map((gasto) => [gasto.descripcion, gasto.monto.toFixed(2)]),
    theme: "grid",
    styles: { halign: "center" },
  });

  // Total del día
  const totalVentas = ventas.reduce(
    (acc, venta) => acc + venta.pipas * venta.precio_unitario,
    0
  );
  const totalGastos = gastos.reduce((acc, gasto) => acc + gasto.monto, 0);
  const totalDia = totalVentas - totalGastos;

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text(`Total del día: ${totalDia.toFixed(2)} Bs`, 14, finalY);

  // Descargar
  doc.save(`resumen_${fecha}.pdf`);
}
