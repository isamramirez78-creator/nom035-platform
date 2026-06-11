import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { data: company } = useQuery<{ nombreEmpresa: string }>({
    queryKey: ["/api/company-info"],
  });

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-clipboard-check text-white text-sm"></i>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Evaluador NOM-035-STPS</h1>
              <p className="text-sm text-slate-500">Sistema de Evaluación de Riesgos Psicosociales</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">
              <i className="fas fa-building text-slate-400 mr-1"></i>
              {company?.nombreEmpresa ?? "Cargando..."}
            </span>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              <i className="fas fa-user-circle mr-1"></i>
              Admin
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
