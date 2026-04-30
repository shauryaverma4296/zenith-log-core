import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = ["en", "zh", "ar", "fr", "de", "ru", "tr"] as const;
type Locale = (typeof LOCALES)[number];
type Format = "csv" | "excel" | "json";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Contentful() {
  const { token, hasAccess, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contentType, setContentType] = useState("keyValue");
  const [limit, setLimit] = useState("1000");
  const [select, setSelect] = useState("fields.key,fields.value");
  const [format, setFormat] = useState<Format>("csv");
  const [selectedLocales, setSelectedLocales] = useState<Locale[]>(["en"]);
  const [loading, setLoading] = useState(false);

  if (!hasAccess("contentful")) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        You don't have access to this page.
      </div>
    );
  }

  const allSelected = selectedLocales.length === LOCALES.length;
  const toggleAll = () => {
    setSelectedLocales(allSelected ? [] : [...LOCALES]);
  };
  const toggleLocale = (loc: Locale) => {
    setSelectedLocales((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const handleExport = async () => {
    if (!contentType.trim()) {
      toast({ variant: "destructive", title: "content_type is required" });
      return;
    }
    if (selectedLocales.length === 0) {
      toast({ variant: "destructive", title: "Select at least one locale" });
      return;
    }

    setLoading(true);
    try {
      const localeParam = allSelected ? "ALL" : selectedLocales.join(",");
      const params = new URLSearchParams({
        content_type: contentType.trim(),
        limit,
        locale: localeParam,
        export: format,
      });
      if (select.trim()) params.set("select", select.trim());

      const res = await fetch(`${API_BASE}/api/contentful/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Export failed (${res.status})`);
      }

      // Derive filename
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const ext = format === "excel" ? "xls" : format;
      const filename = match?.[1] || `contentful-${contentType}.${ext}`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: "Export downloaded", description: filename });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ variant: "destructive", title: "Export failed", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 bg-card border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/select")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <span className="font-semibold">Contentful Utility</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Export Contentful entries</h1>
        <p className="text-muted-foreground mb-8">
          Configure your query and download the result as CSV, Excel or JSON.
        </p>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content type</label>
              <Input
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                placeholder="e.g. keyValue"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Limit</label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select fields (comma-separated)</label>
            <Input
              value={select}
              onChange={(e) => setSelect(e.target.value)}
              placeholder="fields.key,fields.value"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Locales</label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-primary hover:underline"
              >
                {allSelected ? "Clear all" : "Select all (ALL)"}
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {LOCALES.map((loc) => {
                const checked = selectedLocales.includes(loc);
                return (
                  <label
                    key={loc}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm",
                      checked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleLocale(loc)}
                    />
                    <span className="uppercase">{loc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as Format)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="csv">CSV (.csv)</option>
                <option value="excel">Excel (.xls)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>
            <Button onClick={handleExport} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Export
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
