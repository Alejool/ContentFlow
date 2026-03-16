<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    protected $fillable = [
        'gateway',
        'event_id',
        'event_type',
        'status',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    /**
     * Intenta registrar el evento. Retorna false si ya fue procesado (duplicado).
     * Usa INSERT ... ON CONFLICT para ser atómico y evitar race conditions.
     */
    public static function registerOrFail(string $gateway, string $eventId, string $eventType, array $payload = []): bool
    {
        try {
            static::create([
                'gateway'    => $gateway,
                'event_id'   => $eventId,
                'event_type' => $eventType,
                'status'     => 'processed',
                'payload'    => $payload,
            ]);
            return true;
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return false; // Ya procesado
        } catch (\Exception $e) {
            // Fallback para otros drivers que no lanzan UniqueConstraintViolationException
            if (str_contains($e->getMessage(), 'unique') || str_contains($e->getMessage(), 'Duplicate')) {
                return false;
            }
            throw $e;
        }
    }

    public static function alreadyProcessed(string $gateway, string $eventId): bool
    {
        return static::where('gateway', $gateway)->where('event_id', $eventId)->exists();
    }
}
