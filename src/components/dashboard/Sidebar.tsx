import { cn } from "@/lib/utils";
import { ListFilter, AlertCircle, AlertTriangle, Info, Bug } from "lucide-react";

interface SidebarProps {
  currentLevel: string;
  onLevelChange: (level: string) => void;
  logCount: number;
  currentPage: number;
  totalPages: number;
}

const filters = [
  { level: "", label: "All Logs", icon: ListFilter },
  { level: "error", label: "Errors Only", icon: AlertCircle },
  { level: "warn", label: "Warnings", icon: AlertTriangle },
  { level: "info", label: "Info", icon: Info },
  { level: "debug", label: "Debug", icon: Bug },
];

export function Sidebar({ currentLevel, onLevelChange, logCount, currentPage, totalPages }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-border p-4 flex-shrink-0">
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Filters
        </h3>
        <nav className="space-y-1">
          {filters.map(({ level, label, icon: Icon }) => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                currentLevel === level || (!currentLevel && !level)
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Stats
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Logs</span>
            <span className="font-medium">{logCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Page</span>
            <span className="font-medium">{currentPage}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Pages</span>
            <span className="font-medium">{totalPages}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
