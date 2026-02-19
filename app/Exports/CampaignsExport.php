<?php

namespace App\Exports;

use App\Models\Campaigns\Campaign;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\Auth;

class CampaignsExport implements FromQuery, WithHeadings, WithMapping, WithStyles
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $workspaceId = Auth::user()->current_workspace_id;
        
        $query = Campaign::where('workspace_id', $workspaceId)
            ->with(['user', 'publications']);

        if (!empty($this->filters['status']) && $this->filters['status'] !== 'all') {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['search'])) {
            $query->where('name', 'LIKE', '%' . $this->filters['search'] . '%');
        }

        if (!empty($this->filters['date_start']) && !empty($this->filters['date_end'])) {
            $query->byDateRange($this->filters['date_start'], $this->filters['date_end']);
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nombre',
            'Autor',
            'Estado',
            'Publicaciones',
            'Presupuesto',
            'Fecha de Inicio',
            'Fecha de Fin',
            'Fecha de Creación',
        ];
    }

    public function map($campaign): array
    {
        $startDate = 'N/A';
        $endDate = 'N/A';
        $createdAt = 'N/A';

        if ($campaign->start_date) {
            try {
                $startDate = $campaign->start_date instanceof \Carbon\Carbon 
                    ? $campaign->start_date->format('Y-m-d')
                    : \Carbon\Carbon::parse($campaign->start_date)->format('Y-m-d');
            } catch (\Exception $e) {
                $startDate = $campaign->start_date;
            }
        }

        if ($campaign->end_date) {
            try {
                $endDate = $campaign->end_date instanceof \Carbon\Carbon 
                    ? $campaign->end_date->format('Y-m-d')
                    : \Carbon\Carbon::parse($campaign->end_date)->format('Y-m-d');
            } catch (\Exception $e) {
                $endDate = $campaign->end_date;
            }
        }

        if ($campaign->created_at) {
            try {
                $createdAt = $campaign->created_at instanceof \Carbon\Carbon 
                    ? $campaign->created_at->format('Y-m-d H:i:s')
                    : \Carbon\Carbon::parse($campaign->created_at)->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                $createdAt = $campaign->created_at;
            }
        }

        return [
            $campaign->id,
            $campaign->name,
            $campaign->user->name ?? 'N/A',
            ucfirst($campaign->status),
            $campaign->publications->count(),
            $campaign->budget ? '$' . number_format($campaign->budget, 2) : 'N/A',
            $startDate,
            $endDate,
            $createdAt,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
