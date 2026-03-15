<?php

namespace App\Exports;

use App\Models\Publications\Publication;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\Auth;
use App\Services\Subscription\GranularLimitValidator;

class PublicationsExport implements FromQuery, WithHeadings, WithMapping, WithStyles
{
    protected $filters;
    protected $historyStartDate;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
        
        // Get history limit based on plan
        $user = Auth::user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        
        if ($workspace) {
            $validator = app(GranularLimitValidator::class);
            $this->historyStartDate = $validator->getExportStartDate($workspace);
        } else {
            $this->historyStartDate = now()->subDays(30); // Default to 30 days
        }
    }

    public function query()
    {
        $workspaceId = Auth::user()->current_workspace_id;
        
        $query = Publication::where('workspace_id', $workspaceId)
            ->with(['user', 'campaigns', 'socialPostLogs.socialAccount'])
            ->where('created_at', '>=', $this->historyStartDate); // Apply history limit

        if (!empty($this->filters['status']) && $this->filters['status'] !== 'all') {
            $statuses = explode(',', $this->filters['status']);
            $query->whereIn('status', $statuses);
        }

        if (!empty($this->filters['search'])) {
            $query->where('title', 'LIKE', '%' . $this->filters['search'] . '%');
        }

        if (!empty($this->filters['date_start']) && !empty($this->filters['date_end'])) {
            // Respect plan limits even if user specifies custom date range
            $dateStart = max(
                \Carbon\Carbon::parse($this->filters['date_start']),
                $this->historyStartDate
            );
            $query->byDateRange($dateStart->format('Y-m-d'), $this->filters['date_end']);
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'ID',
            'Título',
            'Autor',
            'Estado',
            'Campañas',
            'Plataformas Publicadas',
            'Fecha de Creación',
            'Fecha de Publicación',
        ];
    }

    public function map($publication): array
    {
        $createdAt = 'N/A';
        $publishedAt = 'N/A';

        if ($publication->created_at) {
            try {
                $createdAt = $publication->created_at instanceof \Carbon\Carbon 
                    ? $publication->created_at->format('Y-m-d H:i:s')
                    : \Carbon\Carbon::parse($publication->created_at)->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                $createdAt = $publication->created_at;
            }
        }

        if ($publication->published_at) {
            try {
                $publishedAt = $publication->published_at instanceof \Carbon\Carbon 
                    ? $publication->published_at->format('Y-m-d H:i:s')
                    : \Carbon\Carbon::parse($publication->published_at)->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                $publishedAt = $publication->published_at;
            }
        }

        return [
            $publication->id,
            $publication->title,
            $publication->user->name ?? 'N/A',
            ucfirst($publication->status),
            $publication->campaigns->pluck('name')->join(', ') ?: 'Sin campaña',
            $publication->socialPostLogs->pluck('socialAccount.platform')->unique()->join(', ') ?: 'No publicado',
            $createdAt,
            $publishedAt,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
