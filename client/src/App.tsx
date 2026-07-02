import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

const Landing        = lazy(() => import("@/pages/landing"));
const CompanyLogin   = lazy(() => import("@/pages/company-login"));
const CompanyRegister = lazy(() => import("@/pages/company-register"));
const SubscriptionPlans = lazy(() => import("@/pages/subscription-plans"));
const PublicQuestionnaire = lazy(() => import("@/pages/public-questionnaire"));
const Dashboard    = lazy(() => import("@/pages/dashboard"));
const Employees    = lazy(() => import("@/pages/employees"));
const Reports      = lazy(() => import("@/pages/reports"));
const Expedientes  = lazy(() => import("@/pages/expedientes"));
const Cumplimiento = lazy(() => import("@/pages/cumplimiento-nom035"));
const Invitations  = lazy(() => import("@/pages/employee-invitations"));
const Onboarding   = lazy(() => import("@/pages/onboarding"));
const EmployeeImport = lazy(() => import("@/pages/employee-import"));
const Interventions = lazy(() => import("@/pages/interventions"));
const CompanyProfile = lazy(() => import("@/pages/company-profile"));

const Loading = () => <div style={{padding:"2rem",color:"#64748B",fontFamily:"Inter,sans-serif"}}>Cargando...</div>;

function AppLayout({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("company_token");
  if (!token) return <Redirect to="/login" />;
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter,sans-serif" }}>
      <header style={{ background: "#1E3A5F", borderBottom: "3px solid #84CC16", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, maxWidth: 1280, margin: "0 auto" }}>
          <a href="/dashboard" style={{ color: "white", fontWeight: 700, textDecoration: "none" }}>NOM-035 STPS</a>
          <button onClick={() => { localStorage.removeItem("company_token"); window.location.href = "/login"; }}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "6px 14px", color: "#CBD5E1", fontSize: 12, cursor: "pointer" }}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <nav style={{ background: "#152B47", display: "flex", overflowX: "auto", padding: "0 1rem" }}>
        {[["/dashboard","Panel"],["/employees","Empleados"],["/invitations","Cuestionarios"],["/reports","Reportes"],["/expedientes","Expedientes"],["/compliance-dashboard","Cumplimiento"]].map(([p,l]) => (
          <a key={p} href={p} style={{ color: "#94A3B8", padding: "10px 14px", fontSize: 12, textDecoration: "none", whiteSpace: "nowrap" }}>{l}</a>
        ))}
      </nav>
      <main>
        <Suspense fallback={<Loading />}>
          <Component />
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/">               {() => <Suspense fallback={<Loading />}><Landing /></Suspense>}</Route>
          <Route path="/login">          {() => <Suspense fallback={<Loading />}><CompanyLogin /></Suspense>}</Route>
          <Route path="/company-login">  {() => <Suspense fallback={<Loading />}><CompanyLogin /></Suspense>}</Route>
          <Route path="/company-register">{() => <Suspense fallback={<Loading />}><CompanyRegister /></Suspense>}</Route>
          <Route path="/plans">          {() => <Suspense fallback={<Loading />}><SubscriptionPlans /></Suspense>}</Route>
          <Route path="/subscription-plans">{() => <Suspense fallback={<Loading />}><SubscriptionPlans /></Suspense>}</Route>
          <Route path="/cuestionario/:token">{() => <Suspense fallback={<Loading />}><PublicQuestionnaire /></Suspense>}</Route>
          <Route path="/dashboard">      {() => <AppLayout component={Dashboard} />}</Route>
          <Route path="/onboarding">     {() => <AppLayout component={Onboarding} />}</Route>
          <Route path="/employees">      {() => <AppLayout component={Employees} />}</Route>
          <Route path="/reports">        {() => <AppLayout component={Reports} />}</Route>
          <Route path="/invitations">    {() => <AppLayout component={Invitations} />}</Route>
          <Route path="/compliance-dashboard">{() => <AppLayout component={Cumplimiento} />}</Route>
          <Route path="/expedientes">    {() => <AppLayout component={Expedientes} />}</Route>
          <Route path="/import">         {() => <AppLayout component={EmployeeImport} />}</Route>
          <Route path="/interventions">  {() => <AppLayout component={Interventions} />}</Route>
          <Route path="/company-profile">{() => <AppLayout component={CompanyProfile} />}</Route>
          <Route>{() => <div style={{padding:"2rem"}}><h2>404</h2><a href="/">Inicio</a></div>}</Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
