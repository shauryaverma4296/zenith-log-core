import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AccessTab = "logs" | "contentful";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  access: AccessTab[];
  hasAccess: (tab: AccessTab) => boolean;
  login: (token: string, access: AccessTab[], remember: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_KEY = "authAccess";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessTab[]>([]);

  useEffect(() => {
    const storedToken =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const storedAccess =
      localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
    if (storedToken) setToken(storedToken);
    if (storedAccess) {
      try {
        setAccess(JSON.parse(storedAccess));
      } catch {
        setAccess([]);
      }
    }
  }, []);

  const login = (newToken: string, newAccess: AccessTab[], remember: boolean) => {
    setToken(newToken);
    setAccess(newAccess);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("authToken", newToken);
    storage.setItem(ACCESS_KEY, JSON.stringify(newAccess));
  };

  const logout = () => {
    setToken(null);
    setAccess([]);
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
  };

  const hasAccess = (tab: AccessTab) => access.includes(tab);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!token, token, access, hasAccess, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
