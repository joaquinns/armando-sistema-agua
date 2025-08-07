import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { generarPDFDelDia } from "../lib/generarPDFdelDia";
import { supabase } from "../lib/supabaseClient";
import ResponsiveTableGastos from "./ResponsiveTableGastos";
import { default as ResponsiveTableVentas } from "./ResponsiveTableVentas";

type Venta = {
  id: string;
  pipas: number;
  referencia: string;
  precio_unitario: number;
  fecha: string;
};

type Gasto = {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
};

export default function ResumenDelDia() {
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [totalPages, setTotalPages] = useState<null | number>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [formVenta, setFormVenta] = useState({
    pipas: "",
    referencia: "",
    precio_unitario: "",
  });

  const [formGasto, setFormGasto] = useState({
    descripcion: "",
    monto: "",
  });

  const totalVentas = ventas.reduce(
    (acc, v) => acc + v.pipas * v.precio_unitario,
    0
  );

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
  const totalDia = totalVentas - totalGastos;

  const fetchData = useCallback(async () => {
    setLoading(true);

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { count } = await supabase
      .from("ventas")
      .select("*", { count: "exact", head: true })
      .eq("fecha", fecha);

    const totalPages = count ? Math.ceil(count / pageSize) : 1;
    setTotalPages(totalPages);
    const { data: ventasData } = await supabase
      .from("ventas")
      .select("*")
      .eq("fecha", fecha)
      .range(from, to)
      .order("id", { ascending: false });

    const { data: gastosData } = await supabase
      .from("gastos")
      .select("*")
      .eq("fecha", fecha);

    setVentas(ventasData || []);
    setGastos(gastosData || []);
    setLoading(false);
  }, [fecha, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const agregarVenta = async () => {
    const pipas = Number(formVenta.pipas);
    const precio_unitario = Number(formVenta.precio_unitario);

    if (pipas <= 0 || precio_unitario <= 0) return;

    const { error } = await supabase.from("ventas").insert({
      pipas,
      precio_unitario,
      referencia: formVenta.referencia,
      fecha,
    });

    if (error) {
      console.error(error);
      return;
    }

    setFormVenta({ pipas: "", referencia: "", precio_unitario: "" });
    fetchData();
  };

  const editarVenta = async (venta: {
    id: string;
    pipas: number;
    referencia: string;
    precio_unitario: number;
    fecha?: string;
  }) => {
    const { id, pipas, referencia, precio_unitario } = venta;

    const { error } = await supabase
      .from("ventas")
      .update({ pipas, referencia, precio_unitario })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    fetchData();
  };

  const agregarGasto = async () => {
    const monto = Number(formGasto.monto);
    if (monto <= 0) return;

    const { error } = await supabase.from("gastos").insert({
      descripcion: formGasto.descripcion,
      monto,
      fecha,
    });

    if (error) {
      console.error(error);
      return;
    }

    setFormGasto({ descripcion: "", monto: "" });
    fetchData();
  };

  const editarGasto = async (gasto: any) => {
    const { id, descripcion, monto } = gasto;

    const { error } = await supabase
      .from("gastos")
      .update({ descripcion, monto })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    fetchData();
  };

  const borrarVenta = async (id: string) => {
    await supabase.from("ventas").delete().eq("id", id);
    fetchData();
  };

  const borrarGasto = async (id: string) => {
    await supabase.from("gastos").delete().eq("id", id);
    fetchData();
  };

  const estilosNegativos = (number: number) => {
    if (number < 0) {
      return "text-red-600 font-bold";
    }
    return "text-green-600 font-bold";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex flex-col gap-4 md:gap-0 md:flex-row justify-between items-center">
        <h1 className="text-2xl font-bold">Resumen del Día</h1>
        <button
          onClick={() => generarPDFDelDia(ventas, gastos, fecha)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generar PDF del día
        </button>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      {
        <>
          {/* VENTAS */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Ventas</h2>
            <div className="flex flex-col md:grid md:grid-cols-4 gap-2 mb-2">
              <div className="flex flex-col gap-4">
                <label htmlFor="Pipas" className="font-semibold text-gray-800">
                  Pipas
                </label>
                <input
                  type="number"
                  placeholder="Pipas"
                  value={formVenta.pipas}
                  onChange={(e) =>
                    setFormVenta({
                      ...formVenta,
                      pipas: e.target.value,
                    })
                  }
                  className="border border-gray-400 rounded px-2 py-1"
                />
              </div>
              <div className="flex flex-col gap-4">
                <label htmlFor="Pipas" className="font-semibold text-gray-800">
                  Referencia
                </label>
                <input
                  type="text"
                  placeholder="Referencia"
                  value={formVenta.referencia}
                  onChange={(e) =>
                    setFormVenta({ ...formVenta, referencia: e.target.value })
                  }
                  className="border rounded px-2 py-1"
                />
              </div>
              <div className="flex flex-col gap-4">
                <label htmlFor="Pipas" className="font-semibold text-gray-800">
                  Monto
                </label>
                <input
                  type="number"
                  placeholder="Precio unitario"
                  value={formVenta.precio_unitario}
                  onChange={(e) =>
                    setFormVenta({
                      ...formVenta,
                      precio_unitario: e.target.value,
                    })
                  }
                  className="border rounded px-2 py-1"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={agregarVenta}
                  className="bg-green-600 text-white rounded px-2 py-1"
                >
                  Agregar Venta
                </button>
              </div>
            </div>

            <ResponsiveTableVentas
              data={ventas}
              onDelete={borrarVenta}
              onEdit={editarVenta}
              total={totalDia}
              isLoading={loading}
            />

            <div className="flex justify-end gap-2 pt-8 pb-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1 font-semibold">
                Página {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                disabled={currentPage >= totalPages!}
              >
                Siguiente
              </button>
            </div>

            <p className="text-right font-bold mt-2">
              Total Ventas:{" "}
              <span className="font-bold text-green-600">
                Bs {totalVentas.toFixed(2)}
              </span>
            </p>
          </section>

          {/* GASTOS */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Gastos</h2>
            <div className="flex flex-col md:grid md:grid-cols-3 gap-2 mb-2">
              <div className="flex flex-col gap-4">
                <label htmlFor="Pipas" className="font-semibold text-gray-800">
                  Descripcion
                </label>
                <input
                  type="text"
                  placeholder="Descripción"
                  value={formGasto.descripcion}
                  onChange={(e) =>
                    setFormGasto({ ...formGasto, descripcion: e.target.value })
                  }
                  className="border rounded px-2 py-1"
                />
              </div>
              <div className="flex flex-col gap-4">
                <label htmlFor="Pipas" className="font-semibold text-gray-800">
                  Monto
                </label>
                <input
                  type="number"
                  placeholder="Monto"
                  value={formGasto.monto}
                  onChange={(e) =>
                    setFormGasto({ ...formGasto, monto: e.target.value })
                  }
                  className="border rounded px-2 py-1"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={agregarGasto}
                  className="bg-blue-600 text-white rounded px-2 py-1"
                >
                  Agregar Gasto
                </button>
              </div>
            </div>

            <ResponsiveTableGastos
              isLoading={loading}
              onEdit={editarGasto}
              data={gastos}
              onDelete={borrarGasto}
            />

            <p className="text-right font-bold mt-2">
              Total Gastos:{" "}
              <span className="text-red-600 font-bold">
                Bs -{totalGastos.toFixed(2)}
              </span>
            </p>
          </section>

          {/* RESUMEN FINAL */}
          <section
            className={`text-right text-xl mt-4 ${estilosNegativos(totalDia)}`}
          >
            <span className="font-bold text-black">Total del Día:</span> Bs{" "}
            {totalDia.toFixed(2)}
          </section>
        </>
      }
    </div>
  );
}
