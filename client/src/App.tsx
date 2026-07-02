import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/layout/navigation";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import Questionnaires from "@/pages/questionnaires";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
import SubscriptionPlans from "@/pages/subscription-plans";
import CumplimientoNOM035 from "@/pages/cumplimiento-nom035";
import Checkout from "@/pages/checkout";
import EmployeeImport from "@/pages/employee-import";
import Interventions from "@/pages/interventions";
import EvaluationMethodology from "@/pages/evaluation-methodology";
import TraumaticEventsStatus from "@/pages/traumatic-events-status";
import EmployeeInvitations from "@/pages/employee-invitations";
import PublicQuestionnaire from "@/pages/public-questionnaire";
import CompanyLogin from "@/pages/company-login";
import CompanyRegister from "@/pages/company-register";
import CompanyRegistration from "@/pages/company-registration";
import CompanyProfile from "@/pages/company-profile";
import Expedientes from "@/pages/expedientes";
import Onboarding from "@/pages/onboarding";
import Landing from "@/pages/landing";

// Header simple sin queries complejas
function SimpleHeader() {
  const token = localStorage.getItem("company_token");
  return (
    <header style={{ background: "#1E3A5F", borderBottom: "3px solid #84CC16", padding: "0 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
          <div style={{ width: 34, height: 34, background: "#84CC16", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>NOM-035 STPS</div>
            <div style={{ color: "#94A3B8", fontSize: 11 }}>Plataforma de Evaluación Psicosocial</div>
          </div>
        </div>
        {token && (
          <button
            onClick={() => { localStorage.removeItem("company_token"); window.location.href = "/login"; }}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "6px 14px", color: "#CBD5E1", fontSize: 12, cursor: "pointer" }}>
            Cerrar sesión
          </button>
        )}
      </div>
    </header>
  );
}

function AppLayout({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("company_token");
  if (!token) return <Redirect to="/login" />;
  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <SimpleHeader />
      <Navigation />
      <main><Component /></main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/"                    component={Landing} />
      <Route path="/landing"             component={Landing} />
      <Route path="/login"               component={CompanyLogin} />
      <Route path="/company-login"       component={CompanyLogin} />
      <Route path="/company-register"    component={CompanyRegister} />
      <Route path="/register"            component={CompanyRegistration} />
      <Route path="/plans"               component={SubscriptionPlans} />
      <Route path="/subscription-plans"  component={SubscriptionPlans} />
      <Route path="/cuestionario/:token" component={PublicQuestionnaire} />

      <Route path="/dashboard">          {() => <AppLayout component={Dashboard} />}</Route>
      <Route path="/onboarding">         {() => <AppLayout component={Onboarding} />}</Route>
      <Route path="/employees">          {() => <AppLayout component={Employees} />}</Route>
      <Route path="/employees/:id">      {() => <AppLayout component={EmployeeDetail} />}</Route>
      <Route path="/questionnaires">     {() => <AppLayout component={Questionnaires} />}</Route>
      <Route path="/reports">            {() => <AppLayout component={Reports} />}</Route>
      <Route path="/notifications">      {() => <AppLayout component={Notifications} />}</Route>
      <Route path="/compliance-dashboard">{() => <AppLayout component={CumplimientoNOM035} />}</Route>
      <Route path="/compliance">         {() => <AppLayout component={CumplimientoNOM035} />}</Route>
      <Route path="/import">             {() => <AppLayout component={EmployeeImport} />}</Route>
      <Route path="/interventions">      {() => <AppLayout component={Interventions} />}</Route>
      <Route path="/methodology">        {() => <AppLayout component={EvaluationMethodology} />}</Route>
      <Route path="/traumatic-status">   {() => <AppLayout component={TraumaticEventsStatus} />}</Route>
      <Route path="/invitations">        {() => <AppLayout component={EmployeeInvitations} />}</Route>
      <Route path="/checkout">           {() => <AppLayout component={Checkout} />}</Route>
      <Route path="/company-profile">    {() => <AppLayout component={CompanyProfile} />}</Route>
      <Route path="/expedientes">        {() => <AppLayout component={Expedientes} />}</Route>

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
