<?php

namespace App\Traits;

use App\Models\ExportLog;
use App\Models\Workspace\Workspace;
use App\Models\User;
use App\Services\Subscription\GranularLimitValidator;
use App\Exceptions\LimitReachedException;

/**
 * Trait para rastrear exportaciones y verificar límites.
 * 
 * Uso en controladores de exportación:
 * 
 * use TracksExports;
 * 
 * public function export(Request $request) {
 *     $this->checkExportLimit(); // Verifica límite antes de exportar
 *     
 *     // ... lógica de exportación ...
 *     
 *     $this->logExport('publications', $rowCount, $filePath);
 * }
 */
trait TracksExports
{
    /**
     * Check if user can export (throws exception if limit reached).
     */
    protected function checkExportLimit(): void
    {
        $workspace = $this->getWorkspaceForExport();
        $validator = app(GranularLimitValidator::class);

        if (!$validator->canExport($workspace)) {
            $limits = $validator->getGranularLimits($workspace);
            $used = $validator->getMonthlyExportsCount($workspace);
            
            throw new LimitReachedException(
                'Has alcanzado el límite de exportaciones este mes (' . ($limits['exports_per_month'] ?? 5) . '). Actualiza tu plan para exportar más.',
                [
                    'limit_type' => 'exports_per_month',
                    'current_plan' => $workspace->subscription?->plan ?? 'demo',
                    'limit' => $limits['exports_per_month'] ?? 5,
                    'used' => $used,
                    'workspace_id' => $workspace->id,
                    'workspace_name' => $workspace->name,
                    'upgrade_required' => true,
                ]
            );
        }
    }

    /**
     * Log an export operation.
     */
    protected function logExport(
        string $exportType,
        int $rowsExported,
        ?string $filePath = null
    ): ExportLog {
        $workspace = $this->getWorkspaceForExport();
        $user = auth()->user();

        return ExportLog::logExport(
            $workspace,
            $user,
            $exportType,
            $rowsExported,
            $filePath
        );
    }

    /**
     * Get workspace for export (can be overridden in controller).
     */
    protected function getWorkspaceForExport(): Workspace
    {
        $user = auth()->user();
        return $user->currentWorkspace ?? $user->workspaces()->first();
    }

    /**
     * Get max rows allowed for export.
     */
    protected function getMaxExportRows(): int
    {
        $workspace = $this->getWorkspaceForExport();
        $validator = app(GranularLimitValidator::class);
        
        return $validator->getMaxExportRows($workspace);
    }
}
