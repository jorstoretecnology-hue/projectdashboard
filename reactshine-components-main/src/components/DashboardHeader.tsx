import { Search, Moon, Sun, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar... ⌘K"
          className="pl-10 bg-secondary border-0"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Moon className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground font-medium">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
