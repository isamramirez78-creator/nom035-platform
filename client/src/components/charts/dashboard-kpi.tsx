import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, AlertTriangle, CheckCircle } from "lucide-react";

interface DashboardKPIProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';
  icon?: 'users' | 'warning' | 'check' | 'trend';
}

const colorConfig = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-500',
    border: 'border-green-200'
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    icon: 'text-yellow-500',
    border: 'border-yellow-200'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    icon: 'text-orange-500',
    border: 'border-orange-200'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-500',
    border: 'border-red-200'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-500',
    border: 'border-blue-200'
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    icon: 'text-gray-500',
    border: 'border-gray-200'
  }
};

const iconMap = {
  users: Users,
  warning: AlertTriangle,
  check: CheckCircle,
  trend: TrendingUp
};

export default function DashboardKPI({ 
  title, 
  value, 
  subtitle, 
  trend, 
  color = 'blue',
  icon = 'trend'
}: DashboardKPIProps) {
  const colors = colorConfig[color];
  const IconComponent = iconMap[icon];
  
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : 
                   trend?.direction === 'down' ? TrendingDown : Minus;
  
  const trendColor = trend?.direction === 'up' ? 'text-green-500' :
                    trend?.direction === 'down' ? 'text-red-500' : 'text-gray-500';

  return (
    <Card className={`${colors.bg} ${colors.border} border-2 hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${colors.text}`}>
          {title}
        </CardTitle>
        <IconComponent className={`h-5 w-5 ${colors.icon}`} />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-1">
          <div className={`text-2xl font-bold ${colors.text}`}>
            {value}
          </div>
          
          {subtitle && (
            <p className={`text-xs ${colors.text} opacity-75`}>
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className={`flex items-center text-xs ${trendColor}`}>
              <TrendIcon className="mr-1 h-3 w-3" />
              <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Grid component for dashboard KPIs
interface DashboardKPIGridProps {
  stats: {
    totalEmployees: number;
    evaluationsCompleted: number;
    pendingEvaluations: number;
    highRiskCount: number;
    riskDistribution: { [key: string]: number };
  };
}

export function DashboardKPIGrid({ stats }: DashboardKPIGridProps) {
  const completionRate = stats.totalEmployees > 0 
    ? Math.round((stats.evaluationsCompleted / stats.totalEmployees) * 100)
    : 0;
    
  const highRiskRate = stats.evaluationsCompleted > 0
    ? Math.round((stats.highRiskCount / stats.evaluationsCompleted) * 100)
    : 0;
    
  const lowRiskCount = (stats.riskDistribution['sin-riesgo'] || 0) + (stats.riskDistribution['bajo'] || 0);
  const safetyRate = stats.evaluationsCompleted > 0
    ? Math.round((lowRiskCount / stats.evaluationsCompleted) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardKPI
        title="Total Empleados"
        value={stats.totalEmployees}
        subtitle="Registrados en el sistema"
        color="blue"
        icon="users"
      />
      
      <DashboardKPI
        title="Evaluaciones Completadas"
        value={`${stats.evaluationsCompleted}/${stats.totalEmployees}`}
        subtitle={`${completionRate}% de cobertura`}
        color={completionRate >= 80 ? 'green' : completionRate >= 50 ? 'yellow' : 'orange'}
        icon="check"
        trend={{
          value: completionRate,
          label: 'completado',
          direction: completionRate >= 75 ? 'up' : completionRate >= 50 ? 'neutral' : 'down'
        }}
      />
      
      <DashboardKPI
        title="Empleados Alto Riesgo"
        value={stats.highRiskCount}
        subtitle={`${highRiskRate}% del total evaluado`}
        color={highRiskRate > 20 ? 'red' : highRiskRate > 10 ? 'orange' : 'green'}
        icon="warning"
        trend={{
          value: -highRiskRate,
          label: 'vs objetivo',
          direction: highRiskRate < 10 ? 'up' : 'down'
        }}
      />
      
      <DashboardKPI
        title="Nivel de Seguridad"
        value={`${safetyRate}%`}
        subtitle="Sin riesgo o riesgo bajo"
        color={safetyRate >= 80 ? 'green' : safetyRate >= 60 ? 'yellow' : 'red'}
        icon="check"
        trend={{
          value: safetyRate,
          label: 'empleados seguros',
          direction: safetyRate >= 80 ? 'up' : 'neutral'
        }}
      />
    </div>
  );
}