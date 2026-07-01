import { Switch, Route, Redirect } from "wouter";
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
import CompanyProfile from "@/pages/company-profile";
import Expedientes from "@/pages/expedientes";
import CumplimientoNOM035 from "@/pages/cumplimiento-nom035";
import Landing from "@/pages/landing";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("company_token");
  if (!token) return <Redirect to="/login" />;
  return <Component />;
}

function AppLayout({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("company_token");
  if (!token) return <Redirect to="/login" />;
  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <Header />
      <Navigation />
      <main><Component /></main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/"                component={Landing} />
      <Route path="/landing"         component={Landing} />
      <Route path="/login"           component={CompanyLogin} />
      <Route path="/company-login"   component={CompanyLogin} />
      <Route path="/company-register" component={CompanyRegister} />
      <Route path="/register"        component={CompanyRegistration} />
      <Route path="/plans"           component={SubscriptionPlans} />
      <Route path="/subscription-plans" component={SubscriptionPlans} />
      <Route path="/cuestionario/:token" component={PublicQuestionnaire} />

      <Route path="/dashboard">        {() => <AppLayout component={Dashboard} />}</Route>
      <Route path="/employees">        {() => <AppLayout component={Employees} />}</Route>
      <Route path="/employees/:id">    {() => <AppLayout component={EmployeeDetail} />}</Route>
      <Route path="/questionnaires">   {() => <AppLayout component={Questionnaires} />}</Route>
      <Route path="/reports">          {() => <AppLayout component={Reports} />}</Route>
      <Route path="/notifications">    {() => <AppLayout component={Notifications} />}</Route>
      <Route path="/compliance-dashboard">{() => <AppLayout component={ComplianceDashboard} />}</Route>
      <Route path="/compliance">       {() => <AppLayout component={ComplianceDashboard} />}</Route>
      <Route path="/import">           {() => <AppLayout component={EmployeeImport} />}</Route>
      <Route path="/interventions">    {() => <AppLayout component={Interventions} />}</Route>
      <Route path="/methodology">      {() => <AppLayout component={EvaluationMethodology} />}</Route>
      <Route path="/traumatic-status"> {() => <AppLayout component={TraumaticEventsStatus} />}</Route>
      <Route path="/invitations">      {() => <AppLayout component={EmployeeInvitations} />}</Route>
      <Route path="/checkout">         {() => <AppLayout component={Checkout} />}</Route>
      <Route path="/company-profile">  {() => <AppLayout component={CompanyProfile} />}</Route>
      <Route path="/expedientes">      {() => <AppLayout component={Expedientes} />}</Route>

      <Route component={NotFound} />
    </Switch>
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
