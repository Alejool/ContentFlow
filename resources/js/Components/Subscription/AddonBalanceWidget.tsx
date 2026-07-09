import Button from '@/Components/common/Modern/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import type { AddonSummary } from '@/types/Addons/addon';
import { Link } from '@inertiajs/react';
import { HardDrive, Plus } from 'lucide-react';
import React from 'react';
import { formatCurrency } from '@/Utils/formatters/number';

interface AddonBalanceWidgetProps {
  summary: AddonSummary | null;
  loading?: boolean;
}

export const AddonBalanceWidget: React.FC<AddonBalanceWidgetProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return null;
  }

  // Solo mostrar si tiene add-ons activos o si está cerca del límite
  const hasAddons = summary.active_addons_count > 0;
  const storageLowBalance = summary.storage.percentage_used >= 70 && summary.storage.total > 0;

  if (!hasAddons && !storageLowBalance) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">Add-ons Activos</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/subscription/addons">
            <Plus className="mr-1 h-4 w-4" />
            Comprar
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage */}
        {summary.storage.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Almacenamiento</span>
              </div>
              <span className="text-muted-foreground">
                {summary.storage.remaining} / {summary.storage.total} GB
              </span>
            </div>
            <Progress
              value={summary.storage.percentage_used}
              className="h-2"
              indicatorClassName={
                summary.storage.percentage_used >= 90
                  ? 'bg-red-500'
                  : summary.storage.percentage_used >= 70
                    ? 'bg-yellow-500'
                    : 'bg-purple-500'
              }
            />
          </div>
        )}

        {/* Low Balance Warning */}
        {storageLowBalance && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ Saldo bajo. Considera ampliar tu almacenamiento.
            </p>
          </div>
        )}

        {/* Total Spent */}
        {summary.total_spent > 0 && (
          <div className="text-muted-foreground border-t pt-3 text-xs">
            Total invertido: {formatCurrency(summary.total_spent)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
