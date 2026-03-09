<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'category',
        'label',
        'description',
        'updated_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Boot method to clear cache on save
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($setting) {
            \Log::info("SystemSetting saved: {$setting->key} = {$setting->value}");
            
            // Limpiar caché específico del setting
            Cache::forget("system_setting:{$setting->key}");
            Cache::forget('system_settings:all');
            Cache::forget("system_settings:category:{$setting->category}");
            
            // Limpiar caché de SystemConfigService
            Cache::forget('system:available_plans');
            Cache::forget('system:available_addons');
            
            // Si es un método de pago, limpiar caché del PaymentMethodService
            if ($setting->category === 'payment_methods') {
                \App\Services\PaymentMethodService::clearCache();
            }
            
            \Log::info("Cache cleared for: {$setting->key}");
        });

        static::deleted(function ($setting) {
            Cache::forget("system_setting:{$setting->key}");
            Cache::forget('system_settings:all');
            Cache::forget("system_settings:category:{$setting->category}");
            
            // Limpiar caché de SystemConfigService
            Cache::forget('system:available_plans');
            Cache::forget('system:available_addons');
            
            // Si es un método de pago, limpiar caché del PaymentMethodService
            if ($setting->category === 'payment_methods') {
                \App\Services\PaymentMethodService::clearCache();
            }
        });
    }

    /**
     * Get the user who last updated this setting
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get a setting value with caching (TTL corto para reflejar cambios rápidamente)
     * Para settings críticos como planes, usar getFresh() en su lugar
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("system_setting:{$key}", 60, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            
            if (!$setting) {
                return $default;
            }

            return static::castValue($setting->value, $setting->type);
        });
    }

    /**
     * Get a setting value WITHOUT caching (siempre consulta la DB)
     * Usar para settings que necesitan reflejarse inmediatamente
     */
    public static function getFresh(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        return static::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, $value, ?int $userId = null): bool
    {
        $setting = static::where('key', $key)->first();
        
        if (!$setting) {
            return false;
        }

        $setting->value = static::prepareValue($value, $setting->type);
        $setting->updated_by = $userId;
        
        return $setting->save();
    }

    /**
     * Get all settings by category
     */
    public static function getByCategory(string $category): array
    {
        return Cache::remember("system_settings:category:{$category}", 3600, function () use ($category) {
            return static::where('category', $category)
                ->get()
                ->mapWithKeys(function ($setting) {
                    return [$setting->key => static::castValue($setting->value, $setting->type)];
                })
                ->toArray();
        });
    }

    /**
     * Get all settings grouped by category
     */
    public static function getAllGrouped(): array
    {
        return Cache::remember('system_settings:all', 3600, function () {
            return static::all()
                ->groupBy('category')
                ->map(function ($settings) {
                    return $settings->map(function ($setting) {
                        return [
                            'key' => $setting->key,
                            'value' => static::castValue($setting->value, $setting->type),
                            'type' => $setting->type,
                            'label' => $setting->label,
                            'description' => $setting->description,
                            'updated_at' => $setting->updated_at,
                            'updated_by' => $setting->updatedBy?->name,
                        ];
                    });
                })
                ->toArray();
        });
    }

    /**
     * Cast value based on type
     */
    protected static function castValue($value, string $type)
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Prepare value for storage
     */
    protected static function prepareValue($value, string $type): string
    {
        return match ($type) {
            'boolean' => $value ? 'true' : 'false',
            'json' => json_encode($value),
            default => (string) $value,
        };
    }

    /**
     * Check if a feature is enabled
     */
    public static function isFeatureEnabled(string $feature): bool
    {
        return static::get("feature.{$feature}.enabled", true);
    }

    /**
     * Check if a plan is enabled (sin caché para reflejar cambios inmediatamente)
     */
    public static function isPlanEnabled(string $plan): bool
    {
        return static::getFresh("plan.{$plan}.enabled", true);
    }

    /**
     * Check if an addon type is enabled
     */
    public static function isAddonEnabled(string $addonType): bool
    {
        return static::get("addon.{$addonType}.enabled", true);
    }

    /**
     * Check if an integration is enabled
     */
    public static function isIntegrationEnabled(string $integration): bool
    {
        return static::get("integration.{$integration}.enabled", true);
    }

    /**
     * Check if a payment method is enabled (sin caché para reflejar cambios instantáneamente)
     */
    public static function isPaymentMethodEnabled(string $paymentMethod): bool
    {
        return static::getFresh("payment.{$paymentMethod}.enabled", true);
    }
}
