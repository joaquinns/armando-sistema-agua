import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  // Calcular totales
  const totalVentas = ventas.reduce(
    (acc, venta) => acc + venta.pipas * venta.precio_unitario,
    0
  );
  const totalPipas = ventas.reduce((acc, venta) => acc + venta.pipas, 0);
  const totalGastos = gastos.reduce((acc, gasto) => acc + gasto.monto, 0);
  const totalDia = totalVentas - totalGastos;

  // Tabla de ventas
  autoTable(doc, {
    startY: 25,
    head: [["Pipas", "Referencia", "Precio U.", "Precio Final"]],
    body: ventas.map((venta) => [
      venta.pipas,
      venta.referencia,
      `Bs. ${venta.precio_unitario.toFixed(2)}`,
      `+Bs. ${(venta.pipas * venta.precio_unitario).toFixed(2)}`,
    ]),
    theme: "grid",
    styles: { halign: "center" },
    didDrawCell: (data) => {
      if (
        data.section === "body" &&
        data.column.index === 3 &&
        data.row.index === ventas.length - 1
      ) {
        const x = data.cell.x;
        const y = data.cell.y + data.cell.height + 2;
        const width = data.cell.width;

        // Línea fina negra
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.1);
        doc.line(x, y, x + width, y);

        // Total pequeño en la columna
        doc.setFontSize(9);
        doc.text(`+Bs. ${totalVentas.toFixed(2)}`, x + width / 2, y + 4, {
          align: "center",
        });
      }
    },
  });

  // Texto extra debajo de ventas (a la izquierda)
  let nextY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(12);
  doc.text(`Total Ventas: Bs. ${totalVentas.toFixed(2)}`, 14, nextY);
  nextY += 6;
  doc.text(`Total Pipas: ${totalPipas}`, 14, nextY);

  // Tabla de gastos
  nextY += 8;
  autoTable(doc, {
    startY: nextY,
    head: [["Descripción", "Monto"]],
    body: gastos.map((gasto) => [
      gasto.descripcion,
      `-Bs. ${gasto.monto.toFixed(2)}`,
    ]),
    theme: "grid",
    styles: { halign: "center" },
    didDrawCell: (data) => {
      if (
        data.section === "body" &&
        data.column.index === 1 &&
        data.row.index === gastos.length - 1
      ) {
        const x = data.cell.x;
        const y = data.cell.y + data.cell.height + 2;
        const width = data.cell.width;

        // Línea fina negra
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.1);
        doc.line(x, y, x + width, y);

        // Total pequeño en la columna
        doc.setFontSize(9);
        doc.text(`-Bs. ${totalGastos.toFixed(2)}`, x + width / 2, y + 4, {
          align: "center",
        });
      }
    },
  });

  // Texto debajo de gastos (a la izquierda)
  nextY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(12);
  doc.text(`Total Gastos: -Bs. ${totalGastos.toFixed(2)}`, 14, nextY);

  // Total final
  nextY += 8;
  doc.setFontSize(14);
  doc.text(`Total del día: Bs. ${totalDia.toFixed(2)}`, 14, nextY);

  // Descargar
  doc.save(`resumen_${fecha}.pdf`);
}
