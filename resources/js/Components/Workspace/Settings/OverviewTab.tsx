import StatCard from '@/Components/common/Modern/StatCard';
import { buildQuickActions, buildStats } from '@/Utils/Workspace/overviewTab.config';
import type {
  OverviewTabProps,
  QuickAction,
  StatItem,
} from '@/types/Workspace/overviewTab';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

function QuickActionCard({ action }: { action: QuickAction }) {
  return (
    <motion.button
      variants={fadeUp}
      onClick={action.action}
      className="group flex w-full items-center gap-4 rounded-lg border border-gray-100 bg-white p-4 text-left transition-all duration-200 hover:border-gray-200 hover:shadow-md dark:border-neutral-800 dark:bg-theme-bg-secondary dark:hover:border-neutral-700"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${action.iconBg}`}
      >
        <action.icon className={`h-5 w-5 ${action.iconColor}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {action.label}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-neutral-400">{action.description}</p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors duration-200 group-hover:text-primary-500 dark:text-neutral-600 dark:group-hover:text-primary-400" />
    </motion.button>
  );
}

export default function OverviewTab({ workspace, onTabChange }: OverviewTabProps) {
  const { t } = useTranslation();

  const quickActions = buildQuickActions(onTabChange, t);
  const stats: StatItem[] = buildStats(workspace, t);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.key}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <StatCard icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} />
          </motion.div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-theme-bg-secondary">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('workspace.quick_actions.title')}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.key}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <QuickActionCard action={action} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
