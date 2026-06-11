import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RiskKPIProps {
  riskLevel: string;
  employeeName: string;
  score: number;
  maxScore: number;
  size?: 'small' | 'medium' | 'large';
}

const riskConfig = {
  'sin-riesgo': {
    color: '#22c55e', // green-500
    label: 'Sin Riesgo',
    bgColor: '#dcfce7', // green-100
    textColor: '#166534' // green-800
  },
  'bajo': {
    color: '#84cc16', // lime-500
    label: 'Riesgo Bajo',
    bgColor: '#ecfccb', // lime-100
    textColor: '#365314' // lime-800
  },
  'medio': {
    color: '#eab308', // yellow-500
    label: 'Riesgo Medio',
    bgColor: '#fefce8', // yellow-100
    textColor: '#a16207' // yellow-800
  },
  'alto': {
    color: '#f97316', // orange-500
    label: 'Riesgo Alto',
    bgColor: '#fff7ed', // orange-100
    textColor: '#c2410c' // orange-800
  },
  'muy-alto': {
    color: '#ef4444', // red-500
    label: 'Riesgo Muy Alto',
    bgColor: '#fef2f2', // red-100
    textColor: '#dc2626' // red-800
  }
};

export default function RiskKPI({ riskLevel, employeeName, score, maxScore, size = 'medium' }: RiskKPIProps) {
  const config = riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig['sin-riesgo'];
  const percentage = Math.round((score / maxScore) * 100);
  
  const sizeConfig = {
    small: { 
      circle: 60, 
      strokeWidth: 6, 
      textSize: 'text-sm', 
      titleSize: 'text-xs',
      padding: 'p-3'
    },
    medium: { 
      circle: 80, 
      strokeWidth: 8, 
      textSize: 'text-base', 
      titleSize: 'text-sm',
      padding: 'p-4'
    },
    large: { 
      circle: 100, 
      strokeWidth: 10, 
      textSize: 'text-lg', 
      titleSize: 'text-base',
      padding: 'p-6'
    }
  };
  
  const { circle, strokeWidth, textSize, titleSize, padding } = sizeConfig[size];
  const radius = (circle - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className={`${padding} pb-2`}>
        <CardTitle className={`${titleSize} font-medium text-center truncate`}>
          {employeeName}
        </CardTitle>
      </CardHeader>
      <CardContent className={`${padding} pt-0`}>
        <div className="flex flex-col items-center space-y-2">
          {/* Circular Progress Ring */}
          <div className="relative">
            <svg width={circle} height={circle} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={circle / 2}
                cy={circle / 2}
                r={radius}
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx={circle / 2}
                cy={circle / 2}
                r={radius}
                stroke={config.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`${textSize} font-bold`} style={{ color: config.color }}>
                {percentage}%
              </span>
              <span className="text-xs text-gray-500">
                {score}/{maxScore}
              </span>
            </div>
          </div>
          
          {/* Risk Level Badge */}
          <div 
            className={`px-3 py-1 rounded-full text-xs font-medium text-center min-w-[120px]`}
            style={{ 
              backgroundColor: config.bgColor,
              color: config.textColor
            }}
          >
            {config.label}
          </div>
          
          {/* Risk Indicator Dots */}
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => {
              const isActive = getRiskLevelNumber(riskLevel) >= level;
              return (
                <div
                  key={level}
                  className={`w-2 h-2 rounded-full transition-all duration-300`}
                  style={{
                    backgroundColor: isActive ? config.color : '#e5e7eb'
                  }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getRiskLevelNumber(riskLevel: string): number {
  switch (riskLevel) {
    case 'sin-riesgo': return 1;
    case 'bajo': return 2;
    case 'medio': return 3;
    case 'alto': return 4;
    case 'muy-alto': return 5;
    default: return 1;
  }
}

// Grid component for multiple KPIs
interface RiskKPIGridProps {
  evaluations: Array<{
    id: number;
    employeeName: string;
    riskLevel: string;
    overallScore: number;
    maxScore: number;
  }>;
  size?: 'small' | 'medium' | 'large';
}

export function RiskKPIGrid({ evaluations, size = 'medium' }: RiskKPIGridProps) {
  const gridCols = size === 'small' ? 'grid-cols-4' : size === 'medium' ? 'grid-cols-3' : 'grid-cols-2';
  
  return (
    <div className={`grid ${gridCols} gap-4`}>
      {evaluations.map((evaluation) => (
        <RiskKPI
          key={evaluation.id}
          riskLevel={evaluation.riskLevel}
          employeeName={evaluation.employeeName}
          score={evaluation.overallScore}
          maxScore={evaluation.maxScore}
          size={size}
        />
      ))}
    </div>
  );
}