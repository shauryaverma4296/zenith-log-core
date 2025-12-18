import { useState } from "react";
import { LogEntry } from "@/hooks/useLogs";
import { cn, formatToLocal, formatToLocalFull, syntaxHighlight } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Copy, Table, Database, FileCode, Code } from "lucide-react";

interface LogRowProps {
  log: LogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

type TabType = "table" | "metadata" | "payload" | "json";

export function LogRow({ log, isExpanded, onToggle }: LogRowProps) {
  const [activeTab, setActiveTab] = useState<TabType>("table");
  const { toast } = useToast();

  const copyToClipboard = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({ description: "Copied to clipboard!" });
  };

  const levelClass = `log-level-${log.level}`;

  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "border-b border-border cursor-pointer transition-colors hover:bg-muted/50",
          isExpanded && "bg-muted/30"
        )}
      >
        <td className="p-3">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </td>
        <td className="p-3 font-mono text-xs">{formatToLocal(log.timestamp)}</td>
        <td className="p-3">
          <span className={cn("px-2 py-1 rounded text-xs font-medium uppercase", levelClass)}>
            {log.level}
          </span>
        </td>
        <td className="p-3 text-sm max-w-[150px] truncate">{log.event || "—"}</td>
        <td className="p-3 text-sm max-w-[300px] truncate">{log.message}</td>
        <td className="p-3 font-mono text-xs max-w-[150px] truncate" title={log.correlationId}>
          {log.correlationId || "—"}
        </td>
        <td className="p-3 font-mono text-xs max-w-[150px] truncate" title={log.tibcoTransactionId}>
          {log.tibcoTransactionId || "—"}
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-background/50">
          <td colSpan={7} className="p-4">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex border-b border-border">
                {[
                  { id: "table", label: "Table", icon: Table },
                  { id: "metadata", label: "Metadata", icon: Database },
                  { id: "payload", label: "Payload", icon: FileCode },
                  { id: "json", label: "Full JSON", icon: Code },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={(e) => { e.stopPropagation(); setActiveTab(id as TabType); }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                      activeTab === id
                        ? "bg-primary/10 text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === "table" && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Timestamp</span>
                      <span className="font-mono">{formatToLocalFull(log.timestamp)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Level</span>
                      <span>{log.level}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Event</span>
                      <span>{log.event || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Message</span>
                      <span className="truncate max-w-[200px]">{log.message}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Correlation ID</span>
                      <span className="font-mono text-xs">{log.correlationId || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-xs">{log.tibcoTransactionId || "—"}</span>
                    </div>
                    {log.metadata?.payload?.unitName && (
                      <div className="flex justify-between py-2 border-b border-border col-span-2">
                        <span className="text-muted-foreground">Unit Name</span>
                        <span>{log.metadata.payload.unitName}</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "metadata" && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Metadata</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(log.metadata); }}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </Button>
                    </div>
                    <pre className="bg-background p-4 rounded overflow-auto max-h-80 text-xs font-mono">
                      <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(log.metadata || {}) }} />
                    </pre>
                  </div>
                )}

                {activeTab === "payload" && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Payload</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(log.metadata?.payload); }}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </Button>
                    </div>
                    <pre className="bg-background p-4 rounded overflow-auto max-h-80 text-xs font-mono">
                      <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(log.metadata?.payload || {}) }} />
                    </pre>
                  </div>
                )}

                {activeTab === "json" && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Full Log JSON</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(log); }}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </Button>
                    </div>
                    <pre className="bg-background p-4 rounded overflow-auto max-h-80 text-xs font-mono">
                      <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(log) }} />
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
