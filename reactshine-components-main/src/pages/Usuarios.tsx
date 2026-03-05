import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Users } from "lucide-react";

const Usuarios = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;
