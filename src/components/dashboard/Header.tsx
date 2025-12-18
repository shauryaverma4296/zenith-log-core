import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity, LogOut } from "lucide-react";

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="h-12 bg-card border-b border-border px-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <span className="font-semibold">Logger Dashboard</span>
      </div>
      <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </header>
  );
}
