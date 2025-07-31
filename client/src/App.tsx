import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import LoginForm from "./components/login-form";
import SignupForm from "./components/signup-form";
import Home from "./pages/home";
import NotFound from "./pages/not-found";
import TeamCreationForm from "./components/team-creation-form";
import SpecialRoleForm from "./components/special-role-form";
import MarketingRequestForm from "./components/marketing-request-form";
import AdminDashboard from "./components/admin-dashboard";

function AuthenticatedRoute({ component: Component, requireAdmin = false, ...props }: any) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return <Component {...props} />;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={() => 
        isAuthenticated ? 
          <div>Already logged in! <a href="/">Go to Home</a></div> : 
          <LoginForm onLoginSuccess={() => window.location.href = "/"} />
      } />
      <Route path="/signup" component={() => 
        isAuthenticated ? 
          <div>Already logged in! <a href="/">Go to Home</a></div> : 
          <SignupForm onSignupSuccess={() => window.location.href = "/login"} />
      } />
      <Route path="/team-creation" component={TeamCreationForm} />
      <Route path="/special-roles" component={SpecialRoleForm} />
      <Route path="/marketing-request" component={MarketingRequestForm} />
      
      {/* Protected Admin Routes */}
      <Route path="/admin" component={() => 
        <AuthenticatedRoute component={AdminDashboard} requireAdmin={true} />
      } />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;