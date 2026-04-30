import { useNavigate } from "react-router-dom";
import { useAuth, AccessTab } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollText, Database, Lock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface TileProps {
  tab: AccessTab;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}

export default function SelectRoute() {
  const { hasAccess, logout } = useAuth();
  const navigate = useNavigate();

  const tiles: TileProps[] = [
    {
      tab: "logs",
      title: "Logs",
      description: "Browse, filter and search application logs.",
      icon: ScrollText,
      to: "/dashboard",
    },
    {
      tab: "contentful",
      title: "Contentful Utility",
      description: "Export Contentful entries as CSV, Excel or JSON.",
      icon: Database,
      to: "/contentful",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 bg-card border-b border-border px-4 flex items-center justify-between">
        <span className="font-semibold">Logger Dashboard</span>
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Where would you like to go?</h1>
        <p className="text-muted-foreground mb-10">
          Choose a tool below. Tiles you don't have access to are disabled.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {tiles.map(({ tab, title, description, icon: Icon, to }) => {
            const allowed = hasAccess(tab);
            return (
              <button
                key={tab}
                disabled={!allowed}
                onClick={() => allowed && navigate(to)}
                className={cn(
                  "text-left p-6 rounded-lg border border-border bg-card transition-all",
                  allowed
                    ? "hover:border-primary hover:bg-card/80 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  {!allowed && <Lock className="w-4 h-4 text-muted-foreground" />}
                </div>
                <h2 className="text-lg font-semibold mb-1">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
                {!allowed && (
                  <p className="text-xs text-muted-foreground mt-3">
                    No access — contact an administrator.
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
