import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CompanyLogin from "@/pages/company-login";
import CompanyRegister from "@/pages/company-register";
import SubscriptionPlans from "@/pages/subscription-plans";
import PublicQuestionnaire from "@/pages/public-questionnaire";
import Landing from "@/pages/landing";

// Carga lazy para detectar cual componente rompe todo
import { lazy, Suspense } from "react";
const Dashboard    = lazy(() => import("@/pages/dashboard"));
const Employees    = lazy(() => import("@/pages/employees"));
const Reports      = lazy(() => import("@/pages/reports"));
const Expedientes  = lazy(() => import("@/pages/expedientes"));
const Cumplimiento = lazy(() => import("@/pages/cumplimiento-nom035"));
const Invitations  = lazy(() => import("@/pages/employee-invitations"));
const Onboarding   = lazy(() => import("@/pages/onboarding"));

function SimpleHeader() {
  return (
    <header style={{ background: "#1E3A5F", borderBottom: "3px solid #84CC16", padding: "0 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, maxWidth: 1280, margin: "0 auto" }}>
        <span style={{ color: "white", fontWeight: 700 }}>NOM-035 STPS</span>
        <button onClick={() => { localStorage.removeItem("company_token"); window.location.href = "/login"; }}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "6px 14px", color: "#CBD5E1", fontSize: 12, cursor: "pointer" }}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}

function SimpleNav() {
  const links = ["/dashboard","/employees","/invitations","/reports","/expedientes","/compliance-dashboard","/onboarding"];
  return (
    <nav style={{ background: "#152B47", display: "flex", overflowX: "auto" }}>
      {links.map(p => (
        <a key={p} href={p} style={{ color: "#94A3B8", padding: "10px 14px", fontSize: 12, textDecoration: "none", whiteSpace: "nowrap" }}>
          {p.replace("/","")||"inicio"}
        </a>
      ))}
    </nav>
  );
}

function AppLayout({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("company_token");
  if (!token) return <Redirect to="/login" />;
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <SimpleHeader />
      <SimpleNav />
      <main>
        <Suspense fallback={<div style={{padding:"2rem",color:"#64748B"}}>Cargando...</div>}>
          <Component />
        </Suspense>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/"                    component={Landing} />
      <Route path="/login"               component={CompanyLogin} />
      <Route path="/company-login"       component={CompanyLogin} />
      <Route path="/company-register"    component={CompanyRegister} />
      <Route path="/plans"               component={SubscriptionPlans} />
      <Route path="/subscription-plans"  component={SubscriptionPlans} />
      <Route path="/cuestionario/:token" component={PublicQuestionnaire} />

      <Route path="/dashboard">          {() => <AppLayout component={Dashboard} />}</Route>
      <Route path="/onboarding">         {() => <AppLayout component={Onboarding} />}</Route>
      <Route path="/employees">          {() => <AppLayout component={Employees} />}</Route>
      <Route path="/reports">            {() => <AppLayout component={Reports} />}</Route>
      <Route path="/invitations">        {() => <AppLayout component={Invitations} />}</Route>
      <Route path="/compliance-dashboard">{() => <AppLayout component={Cumplimiento} />}</Route>
      <Route path="/expedientes">        {() => <AppLayout component={Expedientes} />}</Route>

      <Route>{() => <div style={{padding:"2rem"}}><h2>Página no encontrada</h2><a href="/dashboard">Ir al dashboard</a></div>}</Route>
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
