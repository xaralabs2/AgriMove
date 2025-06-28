import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SimpleHomePage from "@/pages/simple-home";
import AuthPage from "@/pages/auth-page";
import { useAuth, AuthProvider } from "./auth/authContext";
import { Loader } from "lucide-react";
import InstallPrompt from "@/components/mobile/InstallPrompt";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  allowedRoles?: string[];
}

function ProtectedRoute({ 
  component: Component, 
  path,
  allowedRoles = ["buyer", "farmer", "driver"] 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="h-screen flex items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!isAuthenticated) {
          return <Redirect to="/auth" />;
        }

        if (user && allowedRoles.includes(user.role)) {
          return <Component />;
        }

        return <NotFound />;
      }}
    </Route>
  );
}

// Import pages
import HomePage from "@/pages/home";
import ProfilePage from "@/pages/profile";
import CartPage from "@/pages/cart";
import OrdersPage from "@/pages/orders";
import FarmerForecasts from "@/pages/farmer/forecasts";
import FarmerOrders from "@/pages/farmer/orders";
import FarmerProduce from "@/pages/farmer/produce";
import ProductDetail from "@/pages/buyer/product-detail";
import FarmDetail from "@/pages/buyer/farm-detail";

function Router() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated ? <Redirect to="/" /> : <AuthPage />}
      </Route>

      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/cart" component={CartPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/search" component={HomePage} />
      <ProtectedRoute path="/product/:id" component={ProductDetail} />
      <ProtectedRoute path="/farm/:id" component={FarmDetail} />
      
      {/* Farmer routes */}
      <ProtectedRoute 
        path="/farmer/forecasts" 
        component={FarmerForecasts} 
        allowedRoles={["farmer"]} 
      />
      <ProtectedRoute 
        path="/farmer/orders" 
        component={FarmerOrders} 
        allowedRoles={["farmer"]} 
      />
      <ProtectedRoute 
        path="/farmer/produce" 
        component={FarmerProduce} 
        allowedRoles={["farmer"]} 
      />

      <Route path="/:rest*">
        <NotFound />
      </Route>
    </Switch>
  );
}

// Added ErrorBoundary component -  This is a placeholder implementation.  A more robust solution might use a library like react-error-boundary.
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      console.warn('Unhandled promise rejection:', event.reason);
      // Don't break the app for promise rejections, just log them
      event.preventDefault();
    };
    
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);
  
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary-500 text-white px-4 py-2 rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  return children;
}


function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
            <InstallPrompt />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;