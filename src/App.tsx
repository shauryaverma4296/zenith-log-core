import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, AccessTab } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SelectRoute from "@/pages/SelectRoute";
import Contentful from "@/pages/Contentful";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  requires,
}: {
  children: React.ReactNode;
  requires?: AccessTab;
}) {
  const { isAuthenticated, hasAccess } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requires && !hasAccess(requires)) return <Navigate to="/select" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/select" replace /> : <Login />}
      />
      <Route
        path="/select"
        element={
          <ProtectedRoute>
            <SelectRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requires="logs">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contentful"
        element={
          <ProtectedRoute requires="contentful">
            <Contentful />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/select" replace />} />
      <Route path="*" element={<Navigate to="/select" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
