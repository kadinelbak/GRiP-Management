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
import NewsFeed from "./components/news-feed";
import MemberServicesPage from "./pages/member-services";
import ToolsPage from "./pages/tools";

function AuthenticatedRoute({ component: Component, requireAdmin = false, requireSpecialRole = false, ...props }: any) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();

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

  // Check for special roles (non-member roles)
  if (requireSpecialRole && user?.role === 'member') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need special privileges to access this page.</p>
          <p className="text-gray-500 text-sm mt-2">Contact an administrator for access.</p>
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
      <Route path="/news" component={NewsFeed} />
      <Route path="/member-services" component={() => 
        <AuthenticatedRoute component={() => <MemberServicesPage />} />
      } />
      <Route path="/tools" component={() => 
        <AuthenticatedRoute component={() => <ToolsPage />} requireSpecialRole={true} />
      } />
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