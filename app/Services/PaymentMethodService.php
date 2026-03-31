<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class PaymentMethodService
{
    /**
     * Obtener todos los métodos de pago disponibles y habilitados
     * SIN CACHÉ - Los cambios se reflejan INSTANTÁNEAMENTE
     */
    public static function getAvailableMethods(?string $countryCode = null): array
    {
        $configMethods = config('payment.available_methods', []);
        $availableMethods = [];

        foreach ($configMethods as $methodKey => $methodConfig) {
            // Verificar si el método está habilitado en system_settings (sin caché)
            $isEnabled = SystemSetting::getFresh("payment.{$methodKey}.enabled", false);
            
            if (!$isEnabled) {
                continue;
            }

            // Si se especifica un país, filtrar por países soportados
            if ($countryCode && !empty($methodConfig['countries'])) {
                if (!in_array($countryCode, $methodConfig['countries'])) {
                    continue;
                }
            }

            $availableMethods[$methodKey] = [
                'key' => $methodKey,
                'name' => $methodConfig['name'],
                'description' => $methodConfig['description'],
                'countries' => $methodConfig['countries'] ?? [],
                'enabled' => true,
            ];
        }

        return $availableMethods;
    }

    /**
     * Verificar si un método de pago específico está disponible
     * SIN CACHÉ - Consulta directa a la base de datos
     */
    public static function isMethodAvailable(string $method, ?string $countryCode = null): bool
    {
        // Verificar que el método existe en la configuración
        $configMethods = config('payment.available_methods', []);
        if (!isset($configMethods[$method])) {
            return false;
        }

        // Verificar que está habilitado en system_settings (sin caché)
        if (!SystemSetting::getFresh("payment.{$method}.enabled", false)) {
            return false;
        }

        // Si se especifica un país, verificar que el método lo soporte
        if ($countryCode) {
            $methodConfig = $configMethods[$method];
            if (!empty($methodConfig['countries']) && !in_array($countryCode, $methodConfig['countries'])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Obtener el gateway preferido para un país
     */
    public static function getPreferredGateway(string $countryCode): string
    {
        // Obtener gateway configurado para el país
        $gateway = config("payment.country_gateways.{$countryCode}");
        
        // Si no hay gateway específico, usar el por defecto
        if (!$gateway) {
            $gateway = config('payment.default_gateway', 'stripe');
        }

        // Verificar que el gateway esté disponible y habilitado
        if (!self::isMethodAvailable($gateway, $countryCode)) {
            // Buscar un gateway alternativo disponible
            $availableMethods = self::getAvailableMethods($countryCode);
            if (!empty($availableMethods)) {
                return array_key_first($availableMethods);
            }
            
            // Si no hay ninguno disponible, retornar el por defecto
            return config('payment.default_gateway', 'stripe');
        }

        return $gateway;
    }

    /**
     * Obtener múltiples opciones de gateway para un país
     */
    public static function getMultipleGateways(string $countryCode): array
    {
        $gateways = config("payment.country_gateways_multiple.{$countryCode}", []);
        
        // Filtrar solo los que están disponibles y habilitados
        return array_filter($gateways, function ($gateway) use ($countryCode) {
            return self::isMethodAvailable($gateway, $countryCode);
        });
    }

    /**
     * Limpiar caché de métodos de pago
     * NOTA: Ya no se usa caché, pero se mantiene por compatibilidad
     */
    public static function clearCache(): void
    {
        Cache::forget('payment_methods:available');
        
        // Limpiar caché por país (solo los más comunes)
        $countries = ['CO', 'MX', 'AR', 'BR', 'CL', 'PE', 'PA', 'US', 'CA', 'GB'];
        foreach ($countries as $country) {
            Cache::forget("payment_methods:available:{$country}");
        }
        
        \Log::info('PaymentMethodService: Cache cleared (aunque ya no se usa caché)');
    }

    /**
     * Validar que un método de pago puede procesar una transacción
     */
    public static function canProcessPayment(string $method, array $data = []): array
    {
        $errors = [];

        // Verificar que el método existe en config
        $configMethods = config('payment.available_methods', []);
        if (!isset($configMethods[$method])) {
            $errors[] = "El método de pago '{$method}' no está configurado en el sistema";
        }

        // Verificar que está habilitado
        if (!SystemSetting::isPaymentMethodEnabled($method)) {
            $errors[] = "El método de pago '{$method}' está deshabilitado";
        }

        // Verificar país si se proporciona
        if (isset($data['country_code'])) {
            $methodConfig = $configMethods[$method] ?? [];
            if (!empty($methodConfig['countries']) && !in_array($data['country_code'], $methodConfig['countries'])) {
                $errors[] = "El método de pago '{$method}' no está disponible en {$data['country_code']}";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}
