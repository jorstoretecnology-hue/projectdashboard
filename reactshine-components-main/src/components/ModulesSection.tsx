import { useState } from "react";
import { Layers, Badge } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  name: string;
  letter: string;
  enabled: boolean;
}

const initialModules: Module[] = [
  { id: "dashboard", name: "Dashboard", letter: "D", enabled: true },
  { id: "users", name: "Users", letter: "U", enabled: true },
  { id: "inventory", name: "Inventory", letter: "I", enabled: true },
  { id: "settings", name: "Settings", letter: "S", enabled: true },
];

export function ModulesSection() {
  const [modules, setModules] = useState(initialModules);

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const activeCount = modules.filter((m) => m.enabled).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold text-foreground">Módulos del Sistema</h2>
            <p className="text-sm text-muted-foreground">
              Activa o desactiva funcionalidades en tiempo real.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
          {activeCount} Activos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {modules.map((module) => (
          <div
            key={module.id}
            className={cn(
              "flex items-center justify-between rounded-xl border p-4 transition-all",
              module.enabled
                ? "border-accent/30 bg-accent/5"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg font-semibold",
                  module.enabled
                    ? "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {module.letter}
              </div>
              <div>
                <p className="font-medium text-foreground">{module.name}</p>
                <p className="text-xs text-muted-foreground">
                  {module.enabled ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <Switch
              checked={module.enabled}
              onCheckedChange={() => toggleModule(module.id)}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
