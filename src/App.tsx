import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ShoppingListProvider } from "@/contexts/ShoppingListContext";
import { ItemsProvider } from "@/contexts/ItemsContext";
import { AddItemProvider } from "@/contexts/AddItemContext";
import Fridge from "./pages/Fridge";
import Login from "./pages/Login";

// Pages that are not needed for the first paint are loaded on demand.
// The dashboard pulls in the charting library, which is the largest dependency.
const Recipes = lazy(() => import("./pages/Recipes"));
const ShoppingListPage = lazy(() => import("./pages/ShoppingListPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <FullPageSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <FullPageSpinner />;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Fridge />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shopping" 
        element={
          <ProtectedRoute>
            <ShoppingListPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/recipes" 
        element={
          <ProtectedRoute>
            <Recipes />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <AuthProvider>
    <ShoppingListProvider>
      <ItemsProvider>
        <BrowserRouter>
          <AddItemProvider>
            <Suspense fallback={<FullPageSpinner />}>
              <AppRoutes />
            </Suspense>
          </AddItemProvider>
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!bg-foreground !text-background !border-none !rounded-full !px-4 !py-2 !shadow-md",
            },
          }}
        />
      </ItemsProvider>
    </ShoppingListProvider>
  </AuthProvider>
);

export default App;
