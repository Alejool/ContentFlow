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
use PhpOffice\PhpSpreadsheet\Style\Color;

class PublicationsTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithEvents
{
    public function array(): array
    {
        return [
            // Fila de descripción (será eliminada al importar)
            [
                'OBLIGATORIO - Título de la publicación',
                'OBLIGATORIO - Contenido principal',
                'OBLIGATORIO - Tipo: post, reel, story, poll, carousel',
                'Opcional - Estado: draft, published, scheduled, pending_review',
                'Opcional - Fecha programada: YYYY-MM-DD HH:MM:SS',
                'Opcional - Hashtags separados por comas',
                'Opcional - URL relacionada',
                'Opcional - Descripción adicional',
                'Opcional - URLs de medios separadas por comas',
                'Opcional - Opciones de encuesta separadas por |',
                'Opcional - Duración de encuesta (1-168 horas)',
            ],
            // Ejemplos
            [
                'Mi Primera Publicación',
                'Este es el contenido de mi publicación. Puede ser tan largo como necesites.',
                'post',
                'draft',
                '2026-03-15 10:00:00',
                '#marketing, #contenido, #social',
                'https://ejemplo.com/enlace-opcional',
                'Descripción opcional de la publicación',
                'https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg',
                '',
                '',
            ],
            [
                'Ejemplo de Encuesta',
                '¿Cuál es tu red social favorita?',
                'poll',
                'draft',
                '',
                '#encuesta, #opinion',
                '',
                '',
                '',
                'Instagram|Facebook|Twitter|TikTok',
                '24',
            ],
        ];
    }

    public function headings(): array
    {
        return [
            'title',
            'body',
            'content_type',
            'status',
            'scheduled_at',
            'hashtags',
            'url',
            'description',
            'media_urls',
            'poll_options',
            'poll_duration_hours',
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
                    'startColor' => ['rgb' => '4472C4']
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
                $event->sheet->getDelegate()->getStyle('A2:K2')->getAlignment()->setWrapText(true);
            },
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 25,
            'B' => 40,
            'C' => 18,
            'D' => 15,
            'E' => 20,
            'F' => 30,
            'G' => 30,
            'H' => 30,
            'I' => 40,
            'J' => 40,
            'K' => 20,
        ];
    }
}
