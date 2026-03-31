<?php

namespace Tests\Feature;

use App\Helpers\LogHelper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class LoggingSystemTest extends TestCase
{
    /**
     * Test que el middleware agrega Trace ID
     */
    public function test_middleware_adds_trace_id_to_response(): void
    {
        $response = $this->get('/');
        
        $response->assertHeader('X-Trace-Id');
        $traceId = $response->headers->get('X-Trace-Id');
        
        $this->assertNotEmpty($traceId);
        $this->assertMatchesRegularExpression('/^[a-f0-9\-]{36}$/', $traceId);
    }

    /**
     * Test que LogHelper genera logs estructurados
     */
    public function test_log_helper_creates_structured_logs(): void
    {
        $logFile = storage_path('logs/uploads.log');
        
        // Limpiar log anterior
        if (file_exists($logFile)) {
            file_put_contents($logFile, '');
        }

        // Generar log
        LogHelper::upload('test.upload', [
            'file' => 'test.mp4',
            'size' => 1024,
        ]);

        // Verificar que el log existe
        $this->assertFileExists($logFile);
        
        // Leer última línea
        $lines = file($logFile);
        $lastLine = end($lines);
        
        // Verificar que es JSON válido
        $data = json_decode($lastLine, true);
        $this->assertIsArray($data);
        
        // Verificar estructura
        $this->assertArrayHasKey('timestamp', $data);
        $this->assertArrayHasKey('level', $data);
        $this->assertArrayHasKey('message', $data);
        $this->assertArrayHasKey('module', $data);
        $this->assertArrayHasKey('action', $data);
        
        // Verificar valores
        $this->assertEquals('uploads', $data['module']);
        $this->assertEquals('test.upload', $data['action']);
        $this->assertEquals('test.mp4', $data['file']);
        $this->assertEquals(1024, $data['size']);
    }

    /**
     * Test búsqueda por Trace ID
     */
    public function test_search_by_trace_id(): void
    {
        // Simular un trace_id
        $traceId = 'test-trace-' . uniqid();
        
        Log::withContext(['trace_id' => $traceId]);
        
        LogHelper::upload('test.search', [
            'file' => 'search-test.mp4',
        ]);

        // Buscar por trace_id
        $results = LogHelper::searchByTraceId($traceId, 'uploads');
        
        $this->assertNotEmpty($results);
        $this->assertIsArray($results);
    }

    /**
     * Test que los errores se loguean en dos canales
     */
    public function test_errors_logged_in_multiple_channels(): void
    {
        $uploadsLog = storage_path('logs/uploads.log');
        $errorsLog = storage_path('logs/errors.log');
        
        // Limpiar logs
        if (file_exists($uploadsLog)) {
            file_put_contents($uploadsLog, '');
        }
        if (file_exists($errorsLog)) {
            file_put_contents($errorsLog, '');
        }

        // Generar error
        LogHelper::uploadError('test.error', 'Test error message', [
            'file' => 'error-test.mp4',
        ]);

        // Verificar que está en ambos logs
        $this->assertFileExists($uploadsLog);
        $this->assertFileExists($errorsLog);
        
        $uploadsContent = file_get_contents($uploadsLog);
        $errorsContent = file_get_contents($errorsLog);
        
        $this->assertStringContainsString('test.error', $uploadsContent);
        $this->assertStringContainsString('test.error', $errorsContent);
    }
}
