import { ChevronRight, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CreateWorkspaceCardProps {
  onClick: () => void;
}

const CreateWorkspaceCard = ({ onClick }: CreateWorkspaceCardProps) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      className="group relative border-2 border-dashed border-gray-300 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-lg p-6 transition-all duration-300 hover:shadow-xl hover:bg-gradient-to-br hover:from-primary-50/30 hover:to-primary-100/30 dark:hover:from-primary-900/5 dark:hover:to-primary-900/10 cursor-pointer hover:-translate-y-1"
    >
      <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center p-4">
        <div className="h-16 w-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Plus className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-neutral-300 mb-2">
          {t("workspace.create_new_workspace")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-neutral-500 mb-6">
          {t("workspace.create_card.subtitle")}
        </p>
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold">
          <span>{t("workspace.create_button_subtitle")}</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceCard;
