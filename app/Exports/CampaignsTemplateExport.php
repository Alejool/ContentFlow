<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class CampaignsTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithEvents
{
    public function array(): array
    {
        return [
            // Fila de descripción
            [
                'OBLIGATORIO - Nombre de la campaña',
                'Opcional - Descripción detallada',
                'Opcional - Estado: active, inactive, completed, paused',
                'Opcional - Fecha inicio: YYYY-MM-DD',
                'Opcional - Fecha fin: YYYY-MM-DD',
                'Opcional - Objetivo de la campaña',
                'Opcional - Presupuesto (número decimal)',
                'Opcional - IDs de publicaciones separados por comas',
            ],
            // Ejemplos
            [
                'Campaña de Verano 2026',
                'Campaña promocional para la temporada de verano',
                'active',
                '2026-06-01',
                '2026-08-31',
                'Aumentar engagement en redes sociales',
                '5000.00',
                '1, 2, 3',
            ],
            [
                'Lanzamiento de Producto',
                'Campaña para el lanzamiento del nuevo producto',
                'inactive',
                '2026-04-01',
                '2026-04-30',
                'Generar awareness del nuevo producto',
                '10000.00',
                '',
            ],
        ];
    }

    public function headings(): array
    {
        return [
            'name',
            'description',
            'status',
            'start_date',
            'end_date',
            'goal',
            'budget',
            'publication_ids',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Encabezados
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '70AD47']
                ],
                'alignment' => ['horizontal' => 'center', 'vertical' => 'center'],
            ],
            // Fila de descripción
            2 => [
                'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '666666']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F2F2F2']
                ],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                // Ajustar altura de filas
                $event->sheet->getDelegate()->getRowDimension(1)->setRowHeight(25);
                $event->sheet->getDelegate()->getRowDimension(2)->setRowHeight(30);
                
                // Habilitar ajuste de texto en fila de descripción
                $event->sheet->getDelegate()->getStyle('A2:H2')->getAlignment()->setWrapText(true);
            },
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 30,
            'B' => 40,
            'C' => 15,
            'D' => 15,
            'E' => 15,
            'F' => 40,
            'G' => 15,
            'H' => 25,
        ];
    }
}
