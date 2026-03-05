import { useState } from "react";
import { Monitor, Sun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const themes = [
  { id: "light" as Theme, label: "Claro", icon: Sun },
  { id: "dark" as Theme, label: "Oscuro", icon: Moon },
  { id: "system" as Theme, label: "Sistema", icon: Monitor },
];

export function AppearanceSection() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>("light");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Monitor className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold text-foreground">Apariencia</h2>
          <p className="text-sm text-muted-foreground">
            Personaliza el tema visual de la interfaz.
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-secondary text-foreground"
              )}
            >
              <theme.icon className="h-5 w-5" />
              <span className="font-medium">{theme.label}</span>
              {isSelected && <Check className="ml-auto h-5 w-5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
