import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, { Fragment, useState } from "react";
import { SkeletonRow } from "./SkeletonRow";

interface RowData {
  id: string;
  pipas: number;
  referencia: string;
  precio_unitario: number;
  fecha?: string;
}

interface ResponsiveTableProps {
  isViajeCerrado: boolean;
  data: RowData[];
  onEdit: (data: RowData) => void;
  onDelete: (id: string) => void;
  total: number;
  isLoading: boolean;
}

const ResponsiveTableVentas: React.FC<ResponsiveTableProps> = ({
  isViajeCerrado,
  data,
  onEdit,
  onDelete,
  total,
  isLoading,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<RowData | null>(null);

  const openEditModal = (venta: RowData) => {
    setSelectedVenta(venta);
    setIsEditOpen(true);
  };

  const openDeleteModal = (venta: RowData) => {
    setSelectedVenta(venta);
    setIsDeleteOpen(true);
  };

  const handleEdit = () => {
    if (isViajeCerrado) return;
    if (selectedVenta) {
      onEdit(selectedVenta);
      setIsEditOpen(false);
    }
  };

  const handleDelete = () => {
    if (isViajeCerrado) return;
    if (selectedVenta) {
      onDelete(selectedVenta.id);
      setIsDeleteOpen(false);
    }
  };

  const precioTotalPipas = (row: RowData) => {
    const total = row.precio_unitario * row.pipas;
    return total.toFixed(2);
  };

  return (
    <>
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 bg-white rounded-md shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Pipas
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Referencia
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Precio U.
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Precio Final
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <SkeletonRow />
            ) : data.length === 0 ? (
              <h2 className="px-4 py-6 text-md text-gray-900 font-semibold w-full">
                No hay ventas para mostrar
              </h2>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.pipas}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.referencia}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600">
                    Bs {row.precio_unitario.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600">
                    Bs {precioTotalPipas(row)}
                  </td>
                  <td className="px-4 py-3 text-sm flex gap-2">
                    <button
                      disabled={isViajeCerrado}
                      onClick={() => openEditModal(row)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      disabled={isViajeCerrado}
                      onClick={() => openDeleteModal(row)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Transition appear show={isEditOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsEditOpen(false)}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded bg-white p-6 shadow-xl transition-all">
                <DialogTitle className="text-lg font-bold">
                  Editar Venta
                </DialogTitle>
                <div className="mt-4 flex flex-col gap-2">
                  <input
                    type="number"
                    value={selectedVenta?.pipas || ""}
                    onChange={(e) =>
                      setSelectedVenta({
                        ...selectedVenta!,
                        pipas: Number(e.target.value),
                      })
                    }
                    className="border px-2 py-1 rounded"
                    placeholder="Pipas"
                  />
                  <input
                    type="text"
                    value={selectedVenta?.referencia || ""}
                    onChange={(e) =>
                      setSelectedVenta({
                        ...selectedVenta!,
                        referencia: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded"
                    placeholder="Referencia"
                  />
                  <input
                    type="number"
                    value={selectedVenta?.precio_unitario || ""}
                    onChange={(e) =>
                      setSelectedVenta({
                        ...selectedVenta!,
                        precio_unitario: Number(e.target.value),
                      })
                    }
                    className="border px-2 py-1 rounded"
                    placeholder="Precio Unitario"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                    Guardar
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal de eliminar */}
      <Transition appear show={isDeleteOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsDeleteOpen(false)}
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
                  ¿Eliminar esta venta?
                </DialogTitle>
                <p className="mt-2 text-gray-700">
                  ¿Estás seguro de que deseas eliminar la venta con referencia "
                  <strong>{selectedVenta?.referencia}</strong>"?
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setIsDeleteOpen(false)}
                    className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded bg-red-600 text-white"
                  >
                    Eliminar
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default ResponsiveTableVentas;
