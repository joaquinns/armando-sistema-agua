import { Input } from "@headlessui/react";

interface AgregarVentasFormProps {
  addVenta: (venta: any) => void;
}

export const AgregarVentasForm = () => {
  return (
    <form>
      <Input className="" />
    </form>
  );
};
