import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLogs } from "@/hooks/useLogs";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { LogsTable } from "@/components/dashboard/LogsTable";
import { Pagination } from "@/components/dashboard/Pagination";
import { getTimezone } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "correlationId";
  const level = searchParams.get("level") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const { data, isLoading, error } = useLogs({ search, type, level, page });

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // Reset page when filters change
    if (!updates.page) {
      newParams.delete("page");
    }
    setSearchParams(newParams);
  };

  const handleSearch = (newSearch: string, newType: string) => {
    updateParams({ search: newSearch, type: newType, page: "" });
  };

  const handleLevelChange = (newLevel: string) => {
    updateParams({ level: newLevel, page: "" });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const clearSearch = () => {
    updateParams({ search: "", type: "correlationId", page: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar
          currentLevel={level}
          onLevelChange={handleLevelChange}
          logCount={data?.logs.length || 0}
          currentPage={data?.currentPage || 1}
          totalPages={data?.totalPages || 1}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <SearchBar
            searchValue={search}
            searchType={type}
            onSearch={handleSearch}
            onClear={clearSearch}
            timezone={getTimezone()}
            totalCount={data?.totalCount || 0}
          />

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading logs...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-error">
                Failed to load logs. Please try again.
              </div>
            ) : (
              <LogsTable
                logs={data?.logs || []}
                expandedRow={expandedRow}
                onRowClick={(id) => setExpandedRow(expandedRow === id ? null : id)}
              />
            )}
          </div>

          {data && data.totalPages > 1 && (
            <Pagination
              currentPage={data.currentPage}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}
