import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import Home from "./pages/home";
import NotFound from "./pages/not-found";
import TeamCreationForm from "./components/team-creation-form";
import SpecialRoleForm from "./components/special-role-form";
import MarketingRequestForm from "./components/marketing-request-form";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/team-creation" component={TeamCreationForm} />
      <Route path="/special-roles" component={SpecialRoleForm} />
      <Route path="/marketing-request" component={MarketingRequestForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;