import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, X, Link, ArrowLeftRight, Box, Clock } from "lucide-react";

interface SearchBarProps {
  searchValue: string;
  searchType: string;
  onSearch: (search: string, type: string) => void;
  onClear: () => void;
  timezone: string;
  totalCount: number;
}

const searchTypes = [
  { value: "correlationId", label: "Correlation ID", icon: Link },
  { value: "tibcoTransactionId", label: "Transaction ID", icon: ArrowLeftRight },
  { value: "unitName", label: "Unit Name", icon: Box },
];

export function SearchBar({ searchValue, searchType, onSearch, onClear, timezone, totalCount }: SearchBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [localType, setLocalType] = useState(searchType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch, localType);
  };

  return (
    <div className="bg-sidebar border-b border-border p-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by correlation ID, transaction ID, or unit name..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        <div className="flex gap-1">
          {searchTypes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLocalType(value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                localType === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        <Button type="submit" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>

        {searchValue && (
          <Button type="button" variant="secondary" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </form>

      <div className="flex items-center justify-between mt-3 text-sm">
        <div className="text-muted-foreground">
          {searchValue ? (
            <>
              Found <strong className="text-foreground">{totalCount}</strong> results for "{searchValue}"
            </>
          ) : (
            <>
              Showing <strong className="text-foreground">{totalCount}</strong> log entries
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-2 bg-card px-3 py-1 rounded text-xs text-primary">
            <Clock className="h-3 w-3" />
            {timezone}
          </span>
          <span>
            Updated: <strong className="text-foreground">{new Date().toLocaleTimeString()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
