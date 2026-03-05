import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Settings } from "lucide-react";

const Configuracion = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Settings className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Ajustes del sistema</p>
      </div>
    </DashboardLayout>
  );
};

export default Configuracion;
