import { AIResponse } from '@/Hooks/useAIChat';
import { Clock, Edit, List, PlayCircle, PlusCircle, TrendingUp, Zap } from 'lucide-react';

interface QuickTipResponseProps {
  data: AIResponse;
  theme: 'dark' | 'light';
}

export default function QuickTipResponse({ data, theme }: QuickTipResponseProps) {
  return (
    <div className="space-y-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary-500" />
        <h3 className="text-lg font-semibold">{data.title || 'Consejo rápido'}</h3>
      </div>

      {data.tip && (
        <div
          className={`rounded-lg p-4 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-primary-900/20 to-yellow-900/20'
              : 'bg-gradient-to-r from-primary-50 to-yellow-50'
          }`}
        >
          <p className="text-sm leading-relaxed">{data.tip}</p>
        </div>
      )}

      {data.response?.message && (
        <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <p className="text-sm leading-relaxed">{data.response.message}</p>
        </div>
      )}

      {/* Resto del componente... */}
      {data.response?.campaign_options && data.response.campaign_options.length > 0 && (
        <CampaignOptions campaigns={data.response.campaign_options} theme={theme} />
      )}

      {data.response?.actions && data.response.actions.length > 0 && (
        <ActionOptions actions={data.response.actions} theme={theme} />
      )}

      {data.response?.steps && data.response.steps.length > 0 && (
        <StepsList steps={data.response.steps} theme={theme} />
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        {data.estimated_time && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{data.estimated_time}</span>
          </div>
        )}
        {data.priority && (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Prioridad: {data.priority}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Componentes auxiliares
interface CampaignOptionsProps {
  campaigns: Array<{
    name: string;
    status: string;
    description: string;
  }>;
  theme: 'dark' | 'light';
}

function CampaignOptions({ campaigns, theme }: CampaignOptionsProps) {
  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <List className="h-4 w-4" />
        Campañas disponibles:
      </h4>
      <div className="space-y-2">
        {campaigns.map((campaign, index) => (
          <div
            key={index}
            className={`rounded-lg border p-3 ${
              theme === 'dark'
                ? 'border-neutral-700 bg-neutral-800/50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{campaign.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      campaign.status === 'active'
                        ? theme === 'dark'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-green-100 text-green-700'
                        : theme === 'dark'
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>
            </div>
            {campaign.description && (
              <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {campaign.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ActionOptionsProps {
  actions: Array<{
    type: string;
    description: string;
  }>;
  theme: 'dark' | 'light';
}

function ActionOptions({ actions, theme }: ActionOptionsProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'edit_campaign':
        return <Edit className="h-4 w-4" />;
      case 'activate_campaign':
        return <PlayCircle className="h-4 w-4" />;
      case 'create_new_campaign':
        return <PlusCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'edit_campaign':
        return 'Editar campaña';
      case 'activate_campaign':
        return 'Activar campaña';
      case 'create_new_campaign':
        return 'Crear nueva campaña';
      default:
        return type;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'edit_campaign':
        return theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
      case 'activate_campaign':
        return theme === 'dark' ? 'text-green-400' : 'text-green-600';
      case 'create_new_campaign':
        return theme === 'dark' ? 'text-purple-400' : 'text-purple-600';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Acciones disponibles:
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {actions.map((action, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 rounded-lg p-3 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-blue-900/10 to-purple-900/10'
                : 'bg-gradient-to-r from-blue-50 to-purple-50'
            }`}
          >
            <div className={`flex-shrink-0 ${getIconColor(action.type)}`}>
              {getActionIcon(action.type)}
            </div>
            <div>
              <p className="text-sm font-medium">{getActionLabel(action.type)}</p>
              <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {action.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StepsListProps {
  steps: string[];
  theme: 'dark' | 'light';
}

function StepsList({ steps, theme }: StepsListProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pasos a seguir:</h4>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex gap-3 rounded-lg p-3 ${
              theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'
            }`}
          >
            <div
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                theme === 'dark' ? 'bg-primary-900/30' : 'bg-primary-100'
              }`}
            >
              <span
                className={`text-xs font-bold ${
                  theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
                }`}
              >
                {index + 1}
              </span>
            </div>
            <div>
              <p className="text-sm">{step}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
