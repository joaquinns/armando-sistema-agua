import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Venta = {
  pipas: number;
  referencia: string;
  precio_unitario: number;
  viaje: number;
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

  // Título principal
  doc.setFontSize(16);
  doc.text("Resumen del día", 14, 15);
  doc.setFontSize(12);
  doc.text(`Fecha: ${fecha}`, 14, 22);

  // Agrupar ventas por viaje
  const ventasPorViaje = ventas.reduce((acc, venta) => {
    if (!acc[venta.viaje]) acc[venta.viaje] = [];
    acc[venta.viaje].push(venta);
    return acc;
  }, {} as Record<number, Venta[]>);

  let startY = 28;

  // Generar tabla para cada viaje
  Object.entries(ventasPorViaje).forEach(([viaje, ventasViaje]) => {
    const totalVentasViaje = ventasViaje.reduce(
      (acc, v) => acc + v.pipas * v.precio_unitario,
      0
    );
    const totalPipasViaje = ventasViaje.reduce((acc, v) => acc + v.pipas, 0);

    // Título del viaje
    doc.setFontSize(13);
    doc.text(`Viaje ${viaje}`, 14, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      head: [["Pipas", "Referencia", "Precio U.", "Precio Final"]],
      body: ventasViaje.map((venta) => [
        venta.pipas,
        venta.referencia,
        `Bs. ${venta.precio_unitario.toFixed(2)}`,
        `+Bs. ${(venta.pipas * venta.precio_unitario).toFixed(2)}`,
      ]),
      theme: "grid",
      styles: { halign: "center" },
    });

    // Totales del viaje
    startY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(11);
    doc.text(
      `Total Ventas (Viaje ${viaje}): Bs. ${totalVentasViaje.toFixed(2)}`,
      14,
      startY
    );
    startY += 5;
    doc.text(`Total Pipas (Viaje ${viaje}): ${totalPipasViaje}`, 14, startY);
    startY += 8;
  });

  // Totales generales
  const totalVentas = ventas.reduce(
    (acc, venta) => acc + venta.pipas * venta.precio_unitario,
    0
  );
  const totalPipas = ventas.reduce((acc, venta) => acc + venta.pipas, 0);
  const totalGastos = gastos.reduce((acc, gasto) => acc + gasto.monto, 0);
  const totalDia = totalVentas - totalGastos;

  // Tabla de gastos
  autoTable(doc, {
    startY,
    head: [["Descripción", "Monto"]],
    body: gastos.map((gasto) => [
      gasto.descripcion,
      `-Bs. ${gasto.monto.toFixed(2)}`,
    ]),
    theme: "grid",
    styles: { halign: "center" },
  });

  // Totales generales debajo
  startY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(12);
  doc.text(`Total Ventas (día): Bs. ${totalVentas.toFixed(2)}`, 14, startY);
  startY += 6;
  doc.text(`Total Pipas (día): ${totalPipas}`, 14, startY);
  startY += 6;
  doc.text(`Total Gastos: -Bs. ${totalGastos.toFixed(2)}`, 14, startY);
  startY += 8;

  doc.setFontSize(14);
  doc.text(`Total del día: Bs. ${totalDia.toFixed(2)}`, 14, startY);

  doc.save(`resumen_${fecha}.pdf`);
}
