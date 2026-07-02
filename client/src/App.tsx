import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CompanyLogin from "@/pages/company-login";
import Landing from "@/pages/landing";
import SubscriptionPlans from "@/pages/subscription-plans";
import PublicQuestionnaire from "@/pages/public-questionnaire";
import CompanyRegister from "@/pages/company-register";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("company_token");
  if (!token) return <Redirect to="/login" />;
  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#1E3A5F", color: "white", padding: "1rem", marginBottom: "1rem", borderRadius: 8 }}>
        <strong>NOM-035 Platform</strong> — ✅ Autenticado
        <button onClick={() => { localStorage.removeItem("company_token"); window.location.href = "/login"; }}
          style={{ float: "right", background: "#EF4444", color: "white", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}>
          Cerrar sesión
        </button>
      </div>
      <nav style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
        {["/dashboard","/employees","/questionnaires","/reports","/expedientes","/invitations","/compliance-dashboard"].map(p => (
          <a key={p} href={p} style={{ background: "#EFF6FF", color: "#1E3A5F", padding: "6px 12px", borderRadius: 6, textDecoration: "none", fontSize: 13 }}>
            {p.replace("/","")}
          </a>
        ))}
      </nav>
      <Component />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/"                   component={Landing} />
      <Route path="/login"              component={CompanyLogin} />
      <Route path="/company-login"      component={CompanyLogin} />
      <Route path="/company-register"   component={CompanyRegister} />
      <Route path="/plans"              component={SubscriptionPlans} />
      <Route path="/subscription-plans" component={SubscriptionPlans} />
      <Route path="/cuestionario/:token" component={PublicQuestionnaire} />

      <Route path="/dashboard">{() => <ProtectedRoute component={() => <h2>Dashboard — funcionando ✅</h2>} />}</Route>
      <Route path="/employees">{() => <ProtectedRoute component={() => <h2>Empleados — funcionando ✅</h2>} />}</Route>
      <Route path="/questionnaires">{() => <ProtectedRoute component={() => <h2>Cuestionarios — funcionando ✅</h2>} />}</Route>
      <Route path="/reports">{() => <ProtectedRoute component={() => <h2>Reportes — funcionando ✅</h2>} />}</Route>
      <Route path="/expedientes">{() => <ProtectedRoute component={() => <h2>Expedientes — funcionando ✅</h2>} />}</Route>
      <Route path="/invitations">{() => <ProtectedRoute component={() => <h2>Invitaciones — funcionando ✅</h2>} />}</Route>
      <Route path="/compliance-dashboard">{() => <ProtectedRoute component={() => <h2>Cumplimiento — funcionando ✅</h2>} />}</Route>

      <Route>{() => <div style={{padding:"2rem"}}><h2>404 — Página no encontrada</h2></div>}</Route>
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
