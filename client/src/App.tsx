import { Switch, Route, useLocation } from "wouter";
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

function Router() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/landing" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/company-login" component={CompanyLogin} />
          <Route path="/company-register" component={CompanyRegister} />
          <Route path="/register" component={CompanyRegistration} />
          <Route path="/plans" component={SubscriptionPlans} />
          <Route path="/subscription-plans" component={SubscriptionPlans} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/compliance" component={ComplianceDashboard} />
          <Route path="/import" component={EmployeeImport} />
          <Route path="/interventions" component={Interventions} />
          <Route path="/methodology" component={EvaluationMethodology} />
          <Route path="/traumatic-status" component={TraumaticEventsStatus} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/" component={Landing} />
          <Route path="/employees" component={Employees} />
          <Route path="/employees/:id" component={EmployeeDetail} />
          <Route path="/questionnaires" component={Questionnaires} />
          <Route path="/invitations" component={EmployeeInvitations} />
          <Route path="/cuestionario/:token" component={PublicQuestionnaire} />
          <Route path="/reports" component={Reports} />
          <Route path="/notifications" component={Notifications} />
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
