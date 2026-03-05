import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Package } from "lucide-react";

const Inventario = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
        <p className="text-muted-foreground">Control de inventario y productos</p>
      </div>
    </DashboardLayout>
  );
};

export default Inventario;
