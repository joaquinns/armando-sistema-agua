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
  descripcion: string;
  monto: number;
  fecha?: string;
}

interface ResponsiveTableProps {
  data: RowData[];
  onEdit: (id: RowData) => void;
  onDelete: (id: string) => void;
  total?: number;
  isLoading?: boolean;
}

const ResponsiveTableGastos: React.FC<ResponsiveTableProps> = ({
  data,
  onDelete,
  onEdit,
  total,
  isLoading,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<RowData | null>(null);

  const openEditModal = (gasto: RowData) => {
    setSelectedGasto(gasto);
    setIsEditOpen(true);
  };

  const openDeleteModal = (gasto: RowData) => {
    setSelectedGasto(gasto);
    setIsDeleteOpen(true);
  };

  const handleEdit = () => {
    if (selectedGasto) {
      onEdit(selectedGasto);
      setIsEditOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedGasto) {
      onDelete(selectedGasto.id);
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 bg-white rounded-md shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Descripcion
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Monto
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
              <h2 className="px-4 py-6 text-md text-gray-900 font-semibold">
                No hay gastos registrados este dia
              </h2>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.descripcion}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600">
                    -{row.monto.toFixed(2)} Bs
                  </td>
                  <td className="px-4 py-3 text-sm flex gap-2">
                    <button
                      onClick={() => openEditModal(row)}
                      className="text-blue-601 hover:underline"
                    >
                      Editar
                    </button>
                    <button
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
                  Editar Gasto
                </DialogTitle>
                <div className="mt-4 flex flex-col gap-2">
                  <input
                    type="text"
                    value={selectedGasto?.descripcion || ""}
                    onChange={(e) =>
                      setSelectedGasto({
                        ...selectedGasto!,
                        descripcion: e.target.value,
                      })
                    }
                    className="border px-2 py-1 rounded"
                    placeholder="Descripción"
                  />
                  <input
                    type="number"
                    value={selectedGasto?.monto || ""}
                    onChange={(e) =>
                      setSelectedGasto({
                        ...selectedGasto!,
                        monto: Number(e.target.value),
                      })
                    }
                    className="border px-2 py-1 rounded"
                    placeholder="Monto"
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

      {/* Modal Eliminar */}
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
                  ¿Eliminar este gasto?
                </DialogTitle>
                <p className="mt-2 text-gray-700">
                  ¿Estás seguro de que deseas eliminar el gasto "
                  <strong>{selectedGasto?.descripcion}</strong>"?
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

export default ResponsiveTableGastos;
