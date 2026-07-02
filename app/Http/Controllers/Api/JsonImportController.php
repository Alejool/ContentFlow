<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Imports\ImportJsonRequest;
use App\Services\Imports\PublicationJsonImportService;
use Illuminate\Http\JsonResponse;

class JsonImportController extends Controller
{
    public function __construct(
        private PublicationJsonImportService $importService
    ) {}

    /**
     * Bulk import publications and/or campaigns from a JSON file or raw payload.
     */
    public function import(ImportJsonRequest $request): JsonResponse
    {
        $result = $this->importService->import($request->jsonPayload(), $request->user());

        $response = [
            'success' => $result['failed_count'] === 0,
            'message' => $result['failed_count'] === 0
                ? 'Importación completada'
                : 'Importación completada con errores',
            'data' => [
                'success_count' => $result['success_count'],
                'failed_count' => $result['failed_count'],
                'total' => $result['total'],
                'publication_ids' => $result['publication_ids'],
                'campaign_ids' => $result['campaign_ids'],
            ],
        ];

        if (!empty($result['errors'])) {
            $response['errors'] = $result['errors'];
        }

        return response()->json($response, 200);
    }

    /**
     * Downloadable example JSON covering both standalone publications
     * and campaigns with nested publications.
     */
    public function downloadTemplate(): JsonResponse
    {
        $template = [
            'publications' => [
                [
                    'title' => 'Mi primera publicación',
                    'body' => 'Contenido principal de la publicación',
                    'content_type' => 'post',
                    'status' => 'draft',
                    'scheduled_at' => null,
                    'description' => 'Descripción opcional',
                    'url' => 'https://ejemplo.com/landing',
                    'hashtags' => ['#marketing', '#social'],
                    'media' => ['https://ejemplo.com/imagen.jpg'],
                ],
            ],
            'campaigns' => [
                [
                    'name' => 'Campaña de lanzamiento',
                    'description' => 'Descripción de la campaña',
                    'status' => 'active',
                    'start_date' => '2026-07-01',
                    'end_date' => '2026-07-31',
                    'goal' => 'Aumentar alcance',
                    'budget' => 1000,
                    'publications' => [
                        [
                            'title' => 'Publicación de la campaña',
                            'body' => 'Contenido de la publicación',
                            'content_type' => 'post',
                            'status' => 'scheduled',
                            'scheduled_at' => '2026-07-10 10:00:00',
                            'hashtags' => ['#lanzamiento'],
                            'media' => ['https://ejemplo.com/imagen2.png'],
                        ],
                    ],
                ],
            ],
        ];

        return response()->json($template, 200, [
            'Content-Disposition' => 'attachment; filename="plantilla_importacion.json"',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Field reference for building the JSON manually.
     */
    public function getInstructions(): JsonResponse
    {
        return response()->json([
            'structure' => 'Objeto raíz con "publications" (array) y/o "campaigns" (array). Las campañas pueden incluir "publications" anidadas.',
            'publication' => [
                'required_fields' => [
                    'title' => 'Título de la publicación (máximo 255 caracteres)',
                    'body' => 'Contenido principal de la publicación',
                ],
                'optional_fields' => [
                    'content_type' => 'Tipo: ' . implode(', ', PublicationJsonImportService::SUPPORTED_CONTENT_TYPES) . ' (por defecto: post)',
                    'status' => 'Estado: draft, scheduled, published, pending_review (por defecto: draft)',
                    'scheduled_at' => 'Fecha y hora programada UTC (YYYY-MM-DD HH:MM:SS). Obligatoria si status=scheduled',
                    'description' => 'Descripción adicional',
                    'url' => 'URL relacionada',
                    'hashtags' => 'Array de hashtags (ej: ["#marketing", "social"])',
                    'media' => 'Array de URLs de imágenes (' . implode(', ', PublicationJsonImportService::IMAGE_EXTENSIONS) . ')',
                ],
            ],
            'campaign' => [
                'required_fields' => [
                    'name' => 'Nombre de la campaña (máximo 255 caracteres)',
                ],
                'optional_fields' => [
                    'description' => 'Descripción de la campaña',
                    'status' => 'Estado: active, inactive, completed, paused (por defecto: active)',
                    'start_date' => 'Fecha de inicio (YYYY-MM-DD)',
                    'end_date' => 'Fecha de fin (YYYY-MM-DD)',
                    'goal' => 'Objetivo de la campaña',
                    'budget' => 'Presupuesto (número decimal)',
                    'publications' => 'Array de publicaciones anidadas (mismo formato que "publication")',
                ],
            ],
        ]);
    }
}
