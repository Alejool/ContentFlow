<?php

namespace App\Exports;

use App\Models\Social\SocialPostLog;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\Auth;

class SocialPostLogsExport implements FromQuery, WithHeadings, WithMapping, WithStyles
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $workspaceId = Auth::user()->current_workspace_id;
        
        $query = SocialPostLog::where('workspace_id', $workspaceId)
            ->with(['socialAccount', 'publication.campaigns']);

        if (!empty($this->filters['status']) && $this->filters['status'] !== 'all') {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['platform'])) {
            $platforms = is_array($this->filters['platform']) 
                ? $this->filters['platform'] 
                : [$this->filters['platform']];
            
            if (!empty($platforms)) {
                $query->whereIn('platform', $platforms);
            }
        }

        if (!empty($this->filters['date_start'])) {
            $query->where('created_at', '>=', $this->filters['date_start'] . ' 00:00:00');
        }

        if (!empty($this->filters['date_end'])) {
            $query->where('created_at', '<=', $this->filters['date_end'] . ' 23:59:59');
        }

        return $query->orderBy('updated_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'ID',
            'Publicación',
            'Plataforma',
            'Cuenta',
            'Estado',
            'URL del Post',
            'Fecha de Publicación',
            'Error',
        ];
    }

    public function map($log): array
    {
        $publishedAt = 'N/A';
        if ($log->published_at) {
            try {
                $publishedAt = $log->published_at instanceof \Carbon\Carbon 
                    ? $log->published_at->format('Y-m-d H:i:s')
                    : \Carbon\Carbon::parse($log->published_at)->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                $publishedAt = $log->published_at;
            }
        }

        return [
            $log->id,
            $log->publication->title ?? 'N/A',
            ucfirst($log->platform),
            $log->socialAccount->account_name ?? 'N/A',
            ucfirst($log->status),
            $log->post_url ?? 'N/A',
            $publishedAt,
            $log->error_message ?? 'N/A',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
