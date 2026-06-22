import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import Questionnaires from "@/pages/questionnaires";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
import Login from "@/pages/login";
import CompanyRegistration from "@/pages/company-registration";
import SubscriptionPlans from "@/pages/subscription-plans";
import ComplianceDashboard from "@/pages/compliance-dashboard";
import Checkout from "@/pages/checkout";
import EmployeeImport from "@/pages/employee-import";
import Interventions from "@/pages/interventions";
import EvaluationMethodology from "@/pages/evaluation-methodology";
import TraumaticEventsStatus from "@/pages/traumatic-events-status";
import EmployeeInvitations from "@/pages/employee-invitations";
import PublicQuestionnaire from "@/pages/public-questionnaire";
import CompanyLogin from "@/pages/company-login";
import CompanyRegister from "@/pages/company-register";
import Landing from "@/pages/landing";

// ─── Guard de autenticación ───────────────────────────────────────────────────
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("company_token");
  if (!token) {
    return <Redirect to="/login" />;
  }
  return <Component />;
}

function Router() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          {/* Rutas públicas */}
          <Route path="/" component={Landing} />
          <Route path="/landing" component={Landing} />
          <Route path="/login" component={CompanyLogin} />
          <Route path="/company-login" component={CompanyLogin} />
          <Route path="/company-register" component={CompanyRegister} />
          <Route path="/register" component={CompanyRegistration} />
          <Route path="/plans" component={SubscriptionPlans} />
          <Route path="/subscription-plans" component={SubscriptionPlans} />
          <Route path="/cuestionario/:token" component={PublicQuestionnaire} />

          {/* Rutas protegidas — requieren login */}
          <Route path="/dashboard">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/employees">
            <ProtectedRoute component={Employees} />
          </Route>
          <Route path="/employees/:id">
            <ProtectedRoute component={EmployeeDetail} />
          </Route>
          <Route path="/questionnaires">
            <ProtectedRoute component={Questionnaires} />
          </Route>
          <Route path="/reports">
            <ProtectedRoute component={Reports} />
          </Route>
          <Route path="/notifications">
            <ProtectedRoute component={Notifications} />
          </Route>
          <Route path="/compliance-dashboard">
            <ProtectedRoute component={ComplianceDashboard} />
          </Route>
          <Route path="/compliance">
            <ProtectedRoute component={ComplianceDashboard} />
          </Route>
          <Route path="/import">
            <ProtectedRoute component={EmployeeImport} />
          </Route>
          <Route path="/interventions">
            <ProtectedRoute component={Interventions} />
          </Route>
          <Route path="/methodology">
            <ProtectedRoute component={EvaluationMethodology} />
          </Route>
          <Route path="/traumatic-status">
            <ProtectedRoute component={TraumaticEventsStatus} />
          </Route>
          <Route path="/invitations">
            <ProtectedRoute component={EmployeeInvitations} />
          </Route>
          <Route path="/checkout">
            <ProtectedRoute component={Checkout} />
          </Route>

          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
