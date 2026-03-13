<?php

namespace App\Logging;

use Monolog\Formatter\JsonFormatter as MonologJsonFormatter;
use Monolog\LogRecord;

/**
 * Formatter personalizado para logs estructurados en JSON
 * Optimizado para búsqueda y análisis
 */
class JsonFormatter extends MonologJsonFormatter
{
    public function __construct()
    {
        parent::__construct(
            batchMode: self::BATCH_MODE_NEWLINES,
            appendNewline: true,
            ignoreEmptyContextAndExtra: false,
            includeStacktraces: true
        );
    }

    /**
     * Formatea el log record en JSON estructurado
     */
    public function format(LogRecord $record): string
    {
        $data = [
            'timestamp' => $record->datetime->format('Y-m-d\TH:i:s.uP'),
            'level' => strtolower($record->level->getName()),
            'message' => $record->message,
        ];

        // Agregar contexto si existe
        if (!empty($record->context)) {
            $data = array_merge($data, $this->normalizeContext($record->context));
        }

        // Agregar extra info si existe
        if (!empty($record->extra)) {
            $data['extra'] = $record->extra;
        }

        return $this->toJson($data) . "\n";
    }

    /**
     * Normaliza el contexto para mejor estructura
     */
    private function normalizeContext(array $context): array
    {
        $normalized = [];

        foreach ($context as $key => $value) {
            // Convertir excepciones a formato legible
            if ($value instanceof \Throwable) {
                $normalized[$key] = [
                    'class' => get_class($value),
                    'message' => $value->getMessage(),
                    'code' => $value->getCode(),
                    'file' => $value->getFile(),
                    'line' => $value->getLine(),
                    'trace' => $value->getTraceAsString(),
                ];
            } else {
                $normalized[$key] = $value;
            }
        }

        return $normalized;
    }
}
