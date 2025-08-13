import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { format, set } from "date-fns";
import { Fragment, useCallback, useEffect, useState } from "react";
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
  viaje: number;
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
  const [viaje, setViaje] = useState(1);
  const [viajesCerrados, setViajesCerrados] = useState<any[]>([]);
  const [viajeCerrado, setViajeCerrado] = useState(false);
  const [isCerrarViajeOpen, setIsCerrarViajeOpen] = useState(false);
  const [ventasDia, setVentasDia] = useState<Venta[]>([]);

  const [formVenta, setFormVenta] = useState({
    pipas: "",
    referencia: "",
    precio_unitario: "",
  });

  const [formGasto, setFormGasto] = useState({
    descripcion: "",
    monto: "",
  });

  const totalVentas = ventasDia.reduce(
    (acc, v) => acc + v.pipas * v.precio_unitario,
    0
  );

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
  const totalPipas = ventas.reduce((acc, v) => acc + v.pipas, 0);
  const totalDia = totalVentas - totalGastos;

  const fetchData = useCallback(async () => {
    setLoading(true);

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: viajesData } = await supabase
      .from("viajes_cerrados")
      .select("*")
      .eq("fecha", fecha)
      .eq("viaje", viaje);

    const { count } = await supabase
      .from("ventas")
      .select("*", { count: "exact", head: true })
      .eq("fecha", fecha)
      .eq("viaje", viaje)
      .order("id", { ascending: false });

    const totalPages = count ? Math.ceil(count / pageSize) : 1;
    setTotalPages(totalPages);
    const { data: ventasData } = await supabase
      .from("ventas")
      .select("*")
      .eq("fecha", fecha)
      .eq("viaje", viaje)
      .limit(100)
      .order("id", { ascending: false });

    const { data: ventasDataDia } = await supabase
      .from("ventas")
      .select("*")
      .eq("fecha", fecha)
      .order("id", { ascending: false });

    const { data: gastosData } = await supabase
      .from("gastos")
      .select("*")
      .eq("fecha", fecha);

    setViajesCerrados(viajesData || []);
    setVentas(ventasData || []);
    setVentasDia(ventasDataDia || []);
    setGastos(gastosData || []);
    setLoading(false);
  }, [fecha, currentPage, viaje]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchEstadoViaje = useCallback(async () => {
    const { data } = await supabase
      .from("viajes_cerrados")
      .select("cerrado")
      .eq("fecha", fecha)
      .eq("viaje", viaje)
      .single();

    setViajeCerrado(!!data?.cerrado);
  }, [fecha, viaje]);

  useEffect(() => {
    fetchEstadoViaje();
  }, [fetchEstadoViaje]);

  const cerrarViaje = async () => {
    const { data: existing, error: errorCheck } = await supabase
      .from("viajes_cerrados")
      .select("*")
      .eq("fecha", fecha)
      .eq("viaje", viaje)
      .limit(1)
      .single();

    if (errorCheck && errorCheck.code !== "PGRST116") {
      // error distinto a no encontrado
      console.error(errorCheck);
      return;
    }

    if (existing) {
      // actualizar a cerrado true si no está cerrado
      if (!existing.cerrado) {
        const { error: errorUpdate } = await supabase
          .from("viajes_cerrados")
          .update({ cerrado: true })
          .eq("id", existing.id);

        if (errorUpdate) {
          console.error(errorUpdate);
          return;
        }
      }
    } else {
      // insertar registro nuevo con cerrado true
      const { error: errorInsert } = await supabase
        .from("viajes_cerrados")
        .insert({
          fecha,
          viaje,
          cerrado: true,
        });

      if (errorInsert) {
        console.error(errorInsert);
        return;
      }
    }

    fetchData();
    fetchEstadoViaje();
    setIsCerrarViajeOpen(false);
  };

  const agregarVenta = async () => {
    if (viajesCerrados.includes(viaje)) {
      alert(`El viaje ${viaje} está cerrado y no se pueden agregar ventas.`);
      return;
    }
    const pipas = Number(formVenta.pipas);
    const precio_unitario = Number(formVenta.precio_unitario);

    if (pipas <= 0 || precio_unitario <= 0) return;

    const { error } = await supabase.from("ventas").insert({
      pipas,
      precio_unitario,
      referencia: formVenta.referencia,
      fecha,
      viaje,
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
    await supabase.from("");
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
          onClick={() => generarPDFDelDia(ventasDia, gastos, fecha)}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold mb-2">Ventas</h2>
              <div className="flex flex-col justify-center items-center gap-4 md:flex-row">
                <h2 className="font-semibold">Viajes</h2>
                <select
                  name="viajes"
                  id="viajes"
                  value={viaje}
                  onChange={(e) => setViaje(Number(e.target.value))}
                  className="border-1 rounded px-2 py-1"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col md:grid md:grid-cols-4 gap-2 mb-2">
              <div className="flex flex-col gap-4">
                <label htmlFor="Pipas" className="font-semibold text-gray-800">
                  Pipas
                </label>
                <input
                  disabled={viajeCerrado}
                  type="number"
                  placeholder="Pipas"
                  value={formVenta.pipas}
                  onChange={(e) =>
                    setFormVenta({
                      ...formVenta,
                      pipas: e.target.value,
                    })
                  }
                  className="border border-gray-400 rounded px-2 py-1 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-4">
                <label htmlFor="Pipas" className="font-semibold text-gray-800">
                  Referencia
                </label>
                <input
                  disabled={viajeCerrado}
                  type="text"
                  placeholder="Referencia"
                  value={formVenta.referencia}
                  onChange={(e) =>
                    setFormVenta({ ...formVenta, referencia: e.target.value })
                  }
                  className="border rounded px-2 py-1 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-4">
                <label htmlFor="Pipas" className="font-semibold text-gray-800">
                  Monto
                </label>
                <input
                  disabled={viajeCerrado}
                  type="number"
                  placeholder="Precio unitario"
                  value={formVenta.precio_unitario}
                  onChange={(e) =>
                    setFormVenta({
                      ...formVenta,
                      precio_unitario: e.target.value,
                    })
                  }
                  className="border rounded px-2 py-1 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  disabled={viajeCerrado}
                  onClick={agregarVenta}
                  className="bg-green-600 text-white rounded px-2 py-1 disabled:opacity-50"
                >
                  Agregar Venta
                </button>
              </div>
            </div>

            <ResponsiveTableVentas
              isViajeCerrado={viajeCerrado}
              data={ventas}
              onDelete={borrarVenta}
              onEdit={editarVenta}
              total={totalDia}
              isLoading={loading}
            />

            <div className="flex justify-end gap-2 pt-8 pb-6">
              <button
                onClick={() => setIsCerrarViajeOpen(true)}
                disabled={viajeCerrado}
                className="bg-red-600 justify-self-start text-white rounded px-3 py-2 disabled:bg-red-200"
              >
                Cerrar Viaje
              </button>
              <Transition appear show={isCerrarViajeOpen} as={Fragment}>
                <Dialog
                  as="div"
                  className="relative z-10"
                  onClose={() => setIsCerrarViajeOpen(false)}
                >
                  <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0 bg-black/25" />
                  </TransitionChild>

                  <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                      <DialogPanel className="w-full max-w-sm rounded bg-white p-6 shadow-xl">
                        <DialogTitle className="text-lg font-bold">
                          ¿Estas seguro que quieres cerrar el viaje{" "}
                          <span>{viaje}</span> ?
                          <p className="text-sm">
                            No podras editar ni borrar ventas y cerraras el
                            viaje
                          </p>
                        </DialogTitle>
                        <div className="mt-6 flex justify-end gap-2">
                          <button
                            onClick={() => setIsCerrarViajeOpen(false)}
                            className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={cerrarViaje}
                            className="px-4 py-2 rounded bg-green-600 text-white"
                          >
                            Confirmar
                          </button>
                        </div>
                      </DialogPanel>
                    </div>
                  </div>
                </Dialog>
              </Transition>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={true}
                //disabled={currentPage === 1}
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
                disabled={true}
                //disabled={currentPage >= totalPages!}
              >
                Siguiente
              </button>
            </div>

            <p className="text-right font-bold mt-2">
              Total Pipas:{" "}
              <span className="font-bold text-gray-800">{totalPipas}</span>
            </p>
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
