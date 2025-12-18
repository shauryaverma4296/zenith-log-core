import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export interface LogEntry {
  _id: string;
  timestamp: string;
  level: string;
  message: string;
  event?: string;
  correlationId?: string;
  tibcoTransactionId?: string;
  metadata?: {
    payload?: {
      unitName?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

interface LogsResponse {
  logs: LogEntry[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface UseLogsParams {
  search?: string;
  type?: string;
  level?: string;
  page?: number;
  limit?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export function useLogs({ search = "", type = "correlationId", level = "", page = 1, limit = 50 }: UseLogsParams) {
  const { token } = useAuth();

  return useQuery<LogsResponse>({
    queryKey: ["logs", search, type, level, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) {
        params.set("search", search);
        params.set("type", type);
      }
      if (level && level !== "all") {
        params.set("level", level);
      }

      const res = await fetch(`${API_BASE}/api/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
}
