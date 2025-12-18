import { LogEntry } from "@/hooks/useLogs";
import { LogRow } from "./LogRow";
import { Inbox } from "lucide-react";

interface LogsTableProps {
  logs: LogEntry[];
  expandedRow: string | null;
  onRowClick: (id: string) => void;
}

export function LogsTable({ logs, expandedRow, onRowClick }: LogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Inbox className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">No logs found</h3>
        <p className="text-sm">Try adjusting your search criteria or check back later</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-card sticky top-0">
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="w-8 p-3"></th>
            <th className="p-3">Timestamp</th>
            <th className="p-3">Level</th>
            <th className="p-3">Event</th>
            <th className="p-3">Message</th>
            <th className="p-3">Correlation ID</th>
            <th className="p-3">Transaction ID</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <LogRow
              key={log._id}
              log={log}
              isExpanded={expandedRow === log._id}
              onToggle={() => onRowClick(log._id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
