<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\PublicationsImport;
use App\Imports\CampaignsImport;
use App\Exports\PublicationsTemplateExport;
use App\Exports\CampaignsTemplateExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;

class ExcelImportController extends Controller
{
    /**
     * Download publications template
     */
    public function downloadPublicationsTemplate()
    {
        return Excel::download(
            new PublicationsTemplateExport(),
            'plantilla_publicaciones.xlsx'
        );
    }

    /**
     * Download campaigns template
     */
    public function downloadCampaignsTemplate()
    {
        return Excel::download(
            new CampaignsTemplateExport(),
            'plantilla_campanas.xlsx'
        );
    }

    /**
     * Import publications from Excel
     */
    public function importPublications(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo inválido',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $import = new PublicationsImport();
            Excel::import($import, $request->file('file'));

            $response = [
                'success' => true,
                'message' => 'Importación completada',
                'data' => [
                    'success_count' => $import->getSuccessCount(),
                    'failed_count' => $import->getFailedCount(),
                    'total' => $import->getSuccessCount() + $import->getFailedCount(),
                ]
            ];

            if ($import->getFailedCount() > 0) {
                $response['errors'] = $import->getErrors();
                $response['message'] = 'Importación completada con errores';
            }

            return response()->json($response, 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el archivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import campaigns from Excel
     */
    public function importCampaigns(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo inválido',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $import = new CampaignsImport();
            Excel::import($import, $request->file('file'));

            $response = [
                'success' => true,
                'message' => 'Importación completada',
                'data' => [
                    'success_count' => $import->getSuccessCount(),
                    'failed_count' => $import->getFailedCount(),
                    'total' => $import->getSuccessCount() + $import->getFailedCount(),
                ]
            ];

            if ($import->getFailedCount() > 0) {
                $response['errors'] = $import->getErrors();
                $response['message'] = 'Importación completada con errores';
            }

            return response()->json($response, 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el archivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get import instructions
     */
    public function getInstructions()
    {
        return response()->json([
            'publications' => [
                'required_fields' => [
                    'title' => 'Título de la publicación (máximo 255 caracteres)',
                    'body' => 'Contenido principal de la publicación',
                    'content_type' => 'Tipo de contenido: post, reel, story, poll, carousel',
                ],
                'optional_fields' => [
                    'status' => 'Estado: draft, published, scheduled, pending_review (por defecto: draft)',
                    'scheduled_at' => 'Fecha y hora programada (formato: YYYY-MM-DD HH:MM:SS)',
                    'hashtags' => 'Hashtags separados por comas (ej: #marketing, #social)',
                    'url' => 'URL relacionada con la publicación',
                    'description' => 'Descripción adicional',
                    'media_urls' => 'URLs de imágenes/videos separadas por comas',
                    'poll_options' => 'Opciones de encuesta separadas por | (solo para content_type=poll)',
                    'poll_duration_hours' => 'Duración de la encuesta en horas (1-168, por defecto: 24)',
                ],
                'examples' => [
                    'post' => 'Publicación estándar con texto e imágenes',
                    'reel' => 'Video corto tipo reel',
                    'story' => 'Historia temporal',
                    'poll' => 'Encuesta con opciones',
                    'carousel' => 'Carrusel de imágenes',
                ],
            ],
            'campaigns' => [
                'required_fields' => [
                    'name' => 'Nombre de la campaña (máximo 255 caracteres)',
                ],
                'optional_fields' => [
                    'description' => 'Descripción de la campaña',
                    'status' => 'Estado: active, inactive, completed, paused (por defecto: active)',
                    'start_date' => 'Fecha de inicio (formato: YYYY-MM-DD)',
                    'end_date' => 'Fecha de fin (formato: YYYY-MM-DD)',
                    'goal' => 'Objetivo de la campaña',
                    'budget' => 'Presupuesto (número decimal)',
                    'publication_ids' => 'IDs de publicaciones separados por comas (ej: 1, 2, 3)',
                ],
            ],
        ]);
    }
}
