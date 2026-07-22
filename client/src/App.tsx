import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, ComponentType } from "react";

const Landing             = lazy(() => import("@/pages/landing"));
const CompanyLogin        = lazy(() => import("@/pages/company-login"));
const CompanyRegister     = lazy(() => import("@/pages/company-register"));
const SubscriptionPlans   = lazy(() => import("@/pages/subscription-plans"));
const PublicQuestionnaire = lazy(() => import("@/pages/public-questionnaire"));
const Dashboard           = lazy(() => import("@/pages/dashboard"));
const Employees           = lazy(() => import("@/pages/employees"));
const Reports             = lazy(() => import("@/pages/reports"));
const Expedientes         = lazy(() => import("@/pages/expedientes"));
const Cumplimiento        = lazy(() => import("@/pages/cumplimiento-nom035"));
const Invitations         = lazy(() => import("@/pages/employee-invitations"));
const Onboarding          = lazy(() => import("@/pages/onboarding"));
const EmployeeImport      = lazy(() => import("@/pages/employee-import"));
const Interventions       = lazy(() => import("@/pages/interventions"));
const CompanyProfile      = lazy(() => import("@/pages/company-profile"));
const DenunciaPublica     = lazy(() => import("@/pages/denuncia-publica"));
const AdminLogin          = lazy(() => import("@/pages/admin-login"));
const ForgotPassword      = lazy(() => import("@/pages/forgot-password"));
const PagoExitoso         = lazy(() => import("@/pages/pago-exitoso"));
const PagoFallido         = lazy(() => import("@/pages/pago-fallido"));
const AdminDashboard      = lazy(() => import("@/pages/admin-dashboard"));
const Notifications       = lazy(() => import("@/pages/notifications"));
const EmployeeDetail      = lazy(() => import("@/pages/employee-detail"));

const Loading = () => <div style={{padding:"2rem",color:"#64748B",fontFamily:"Inter,sans-serif"}}>Cargando...</div>;

function Protected({ component: Component }: { component: ComponentType }) {
  const token = localStorage.getItem("company_token");
  if (!token) return <Redirect to="/login" />;
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter,sans-serif" }}>
      <header style={{ background: "#1E3A5F", borderBottom: "3px solid #84CC16", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, maxWidth: 1280, margin: "0 auto" }}>
          <a href="/dashboard" style={{ color: "white", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>NOM-035 STPS</a>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/company-profile" style={{ color: "#94A3B8", fontSize: 12, textDecoration: "none", padding: "6px 10px" }}>Mi perfil</a>
            <button onClick={() => { localStorage.removeItem("company_token"); window.location.href = "/login"; }}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "6px 14px", color: "#CBD5E1", fontSize: 12, cursor: "pointer" }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <nav style={{ background: "#152B47", display: "flex", overflowX: "auto", padding: "0 1rem" }}>
        {[
          ["/dashboard","Panel",],
          ["/employees","Empleados"],
          ["/invitations","Cuestionarios"],
          ["/reports","Reportes"],
          ["/expedientes","Expedientes"],
          ["/compliance-dashboard","Cumplimiento"],
          ["/import","Importar"],
          ["/interventions","Intervenciones"],
        ].map(([p,l]) => (
          <a key={p} href={p} style={{ padding: "10px 14px", fontSize: 12, textDecoration: "none", whiteSpace: "nowrap",
            borderBottom: window.location.pathname === p ? "2px solid #84CC16" : "2px solid transparent",
            color: window.location.pathname === p ? "#84CC16" : "#94A3B8" as any }}>
            {l}
          </a>
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

// Componentes de ruta protegida
const DashboardRoute     = () => <Protected component={Dashboard} />;
const OnboardingRoute    = () => <Protected component={Onboarding} />;
const EmployeesRoute     = () => <Protected component={Employees} />;
const ReportsRoute       = () => <Protected component={Reports} />;
const InvitationsRoute   = () => <Protected component={Invitations} />;
const CumplimientoRoute  = () => <Protected component={Cumplimiento} />;
const ExpedientesRoute   = () => <Protected component={Expedientes} />;
const ImportRoute        = () => <Protected component={EmployeeImport} />;
const InterventionsRoute = () => <Protected component={Interventions} />;
const ProfileRoute       = () => <Protected component={CompanyProfile} />;
const NotificationsRoute  = () => <Protected component={Notifications} />;
const EmployeeDetailRoute = () => <Protected component={EmployeeDetail} />;

// Componentes de ruta pública
const LandingRoute    = () => <Suspense fallback={<Loading />}><Landing /></Suspense>;
const LoginRoute      = () => <Suspense fallback={<Loading />}><CompanyLogin /></Suspense>;
const ForgotRoute     = () => <Suspense fallback={<Loading />}><ForgotPassword /></Suspense>;
const RegisterRoute   = () => <Suspense fallback={<Loading />}><CompanyRegister /></Suspense>;
const PlansRoute      = () => <Suspense fallback={<Loading />}><SubscriptionPlans /></Suspense>;
const QuestionnaireRoute = () => <Suspense fallback={<Loading />}><PublicQuestionnaire /></Suspense>;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/"                     component={LandingRoute} />
          <Route path="/landing"              component={LandingRoute} />
          <Route path="/login"                component={LoginRoute} />
          <Route path="/company-login"        component={LoginRoute} />
          <Route path="/forgot-password"        component={ForgotRoute} />
          <Route path="/company-register"     component={RegisterRoute} />
          <Route path="/register"             component={RegisterRoute} />
          <Route path="/plans"                component={PlansRoute} />
          <Route path="/subscription-plans"   component={PlansRoute} />
          <Route path="/cuestionario/:token"  component={QuestionnaireRoute} />
          <Route path="/dashboard"            component={DashboardRoute} />
          <Route path="/onboarding"           component={OnboardingRoute} />
          <Route path="/employees"            component={EmployeesRoute} />
          <Route path="/employees/:id"        component={EmployeeDetailRoute} />
          <Route path="/reports"              component={ReportsRoute} />
          <Route path="/invitations"          component={InvitationsRoute} />
          <Route path="/pago-exitoso">{() => <Suspense fallback={<Loading />}><PagoExitoso /></Suspense>}</Route>
          <Route path="/pago-fallido">{() => <Suspense fallback={<Loading />}><PagoFallido /></Suspense>}</Route>
          <Route path="/compliance-dashboard" component={CumplimientoRoute} />
          <Route path="/compliance"           component={CumplimientoRoute} />
          <Route path="/expedientes"          component={ExpedientesRoute} />
          <Route path="/import"               component={ImportRoute} />
          <Route path="/interventions"        component={InterventionsRoute} />
          <Route path="/company-profile"      component={ProfileRoute} />
          <Route path="/notifications"        component={NotificationsRoute} />
          <Route component={() => <div style={{padding:"2rem",fontFamily:"Inter,sans-serif"}}><h2>404 — Página no encontrada</h2><a href="/">Ir al inicio</a></div>} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
