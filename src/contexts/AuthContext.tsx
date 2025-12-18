import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string, remember: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (stored) setToken(stored);
  }, []);

  const login = (newToken: string, remember: boolean) => {
    setToken(newToken);
    if (remember) {
      localStorage.setItem("authToken", newToken);
    } else {
      sessionStorage.setItem("authToken", newToken);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
