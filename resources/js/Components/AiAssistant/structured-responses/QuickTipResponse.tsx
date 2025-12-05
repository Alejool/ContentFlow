import { AIResponse } from "@/Hooks/useAIChat";
import {
  Clock,
  Edit,
  List,
  PlayCircle,
  PlusCircle,
  TrendingUp,
  Zap,
} from "lucide-react";

interface QuickTipResponseProps {
  data: AIResponse;
  theme: "dark" | "light";
}

export default function QuickTipResponse({
  data,
  theme,
}: QuickTipResponseProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-lg">
          {data.title || "Consejo rápido"}
        </h3>
      </div>

      {data.tip && (
        <div
          className={`p-4 rounded-lg ${
            theme === "dark"
              ? "bg-gradient-to-r from-orange-900/20 to-yellow-900/20"
              : "bg-gradient-to-r from-orange-50 to-yellow-50"
          }`}
        >
          <p className="text-sm leading-relaxed">{data.tip}</p>
        </div>
      )}

      {data.response?.message && (
        <div
          className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-blue-900/20" : "bg-blue-50"
          }`}
        >
          <p className="text-sm leading-relaxed">{data.response.message}</p>
        </div>
      )}

      {/* Resto del componente... */}
      {data.response?.campaign_options &&
        data.response.campaign_options.length > 0 && (
          <CampaignOptions
            campaigns={data.response.campaign_options}
            theme={theme}
          />
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
            <Clock className="w-3 h-3" />
            <span>{data.estimated_time}</span>
          </div>
        )}
        {data.priority && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
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
  theme: "dark" | "light";
}

function CampaignOptions({ campaigns, theme }: CampaignOptionsProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <List className="w-4 h-4" />
        Campañas disponibles:
      </h4>
      <div className="space-y-2">
        {campaigns.map((campaign, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              theme === "dark"
                ? "bg-neutral-800/50 border-neutral-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{campaign.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      campaign.status === "active"
                        ? theme === "dark"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-green-100 text-green-700"
                        : theme === "dark"
                        ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>
            </div>
            {campaign.description && (
              <p
                className={`text-xs mt-2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
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
  theme: "dark" | "light";
}

function ActionOptions({ actions, theme }: ActionOptionsProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case "edit_campaign":
        return <Edit className="w-4 h-4" />;
      case "activate_campaign":
        return <PlayCircle className="w-4 h-4" />;
      case "create_new_campaign":
        return <PlusCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "edit_campaign":
        return "Editar campaña";
      case "activate_campaign":
        return "Activar campaña";
      case "create_new_campaign":
        return "Crear nueva campaña";
      default:
        return type;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "edit_campaign":
        return theme === "dark" ? "text-blue-400" : "text-blue-600";
      case "activate_campaign":
        return theme === "dark" ? "text-green-400" : "text-green-600";
      case "create_new_campaign":
        return theme === "dark" ? "text-purple-400" : "text-purple-600";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
        Acciones disponibles:
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {actions.map((action, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg flex items-start gap-3 ${
              theme === "dark"
                ? "bg-gradient-to-r from-blue-900/10 to-purple-900/10"
                : "bg-gradient-to-r from-blue-50 to-purple-50"
            }`}
          >
            <div className={`flex-shrink-0 ${getIconColor(action.type)}`}>
              {getActionIcon(action.type)}
            </div>
            <div>
              <p className="font-medium text-sm">
                {getActionLabel(action.type)}
              </p>
              <p
                className={`text-xs mt-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
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
  theme: "dark" | "light";
}

function StepsList({ steps, theme }: StepsListProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
        Pasos a seguir:
      </h4>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex gap-3 p-3 rounded-lg ${
              theme === "dark" ? "bg-neutral-800/50" : "bg-gray-50"
            }`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                theme === "dark" ? "bg-orange-900/30" : "bg-orange-100"
              }`}
            >
              <span
                className={`text-xs font-bold ${
                  theme === "dark" ? "text-orange-400" : "text-orange-600"
                }`}
              >
                {index + 1}
              </span>
            </div>
            <div>
              <p
                className="text-sm"
                dangerouslySetInnerHTML={{
                  __html: step.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
