<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;

class PaymentGatewayService
{
    /**
     * Obtener métodos de pago disponibles para un país específico
     * 
     * @param string|null $countryCode Código ISO del país (ej: 'CO', 'US', 'MX')
     * @return array Lista de gateways habilitados y disponibles para el país
     */
    public function getAvailableGateways(?string $countryCode = null): array
    {
        // Si no se proporciona país, usar el país por defecto
        if (!$countryCode) {
            $countryCode = config('payment.country_detection.default_country', 'US');
        }

        // Obtener gateways configurados para el país
        $countryGateways = config("payment.country_gateways_multiple.{$countryCode}");
        
        // Si no hay configuración específica, usar el gateway por defecto
        if (!$countryGateways) {
            $defaultGateway = config("payment.country_gateways.{$countryCode}") 
                ?? config('payment.default_gateway', 'stripe');
            $countryGateways = [$defaultGateway];
        }

        // Filtrar solo los gateways que están habilitados en el sistema
        $availableGateways = [];
        foreach ($countryGateways as $gateway) {
            if (SystemSetting::isPaymentMethodEnabled($gateway)) {
                $availableGateways[] = [
                    'id' => $gateway,
                    'name' => $this->getGatewayName($gateway),
                    'description' => $this->getGatewayDescription($gateway, $countryCode),
                    'icon' => $this->getGatewayIcon($gateway),
                    'currency' => config("payment.currencies.{$countryCode}", 'USD'),
                ];
            }
        }

        return $availableGateways;
    }

    /**
     * Obtener todos los métodos de pago habilitados (sin filtro por país)
     * 
     * @return array
     */
    public function getAllEnabledGateways(): array
    {
        $allGateways = ['stripe', 'wompi', 'mercadopago', 'payu', 'epayco'];
        $enabled = [];

        foreach ($allGateways as $gateway) {
            if (SystemSetting::isPaymentMethodEnabled($gateway)) {
                $enabled[] = [
                    'id' => $gateway,
                    'name' => $this->getGatewayName($gateway),
                    'description' => $this->getGatewayDescription($gateway),
                    'icon' => $this->getGatewayIcon($gateway),
                ];
            }
        }

        return $enabled;
    }

    /**
     * Verificar si un gateway está disponible para un país
     * 
     * @param string $gateway
     * @param string|null $countryCode
     * @return bool
     */
    public function isGatewayAvailableForCountry(string $gateway, ?string $countryCode = null): bool
    {
        // Verificar que el gateway esté habilitado en el sistema
        if (!SystemSetting::isPaymentMethodEnabled($gateway)) {
            return false;
        }

        // Si no se especifica país, verificar solo si está habilitado
        if (!$countryCode) {
            return true;
        }

        // Verificar si el gateway está configurado para el país
        $countryGateways = config("payment.country_gateways_multiple.{$countryCode}");
        
        if ($countryGateways && in_array($gateway, $countryGateways)) {
            return true;
        }

        // Verificar gateway principal del país
        $primaryGateway = config("payment.country_gateways.{$countryCode}");
        if ($primaryGateway === $gateway) {
            return true;
        }

        // Si el país no tiene configuración específica, permitir el gateway por defecto
        if (!$countryGateways && !$primaryGateway) {
            $defaultGateway = config('payment.default_gateway', 'stripe');
            return $gateway === $defaultGateway;
        }

        return false;
    }

    /**
     * Obtener el gateway recomendado para un país
     * 
     * @param string|null $countryCode
     * @return string|null
     */
    public function getRecommendedGateway(?string $countryCode = null): ?string
    {
        if (!$countryCode) {
            $countryCode = config('payment.country_detection.default_country', 'US');
        }

        // Obtener el gateway principal del país
        $gateway = config("payment.country_gateways.{$countryCode}");
        
        // Si no hay configuración, usar el por defecto
        if (!$gateway) {
            $gateway = config('payment.default_gateway', 'stripe');
        }

        // Verificar que esté habilitado
        if (SystemSetting::isPaymentMethodEnabled($gateway)) {
            return $gateway;
        }

        // Si el recomendado no está habilitado, buscar el primero disponible
        $available = $this->getAvailableGateways($countryCode);
        return $available[0]['id'] ?? null;
    }

    /**
     * Obtener nombre amigable del gateway
     * 
     * @param string $gateway
     * @return string
     */
    private function getGatewayName(string $gateway): string
    {
        $names = [
            'stripe' => 'Stripe',
            'wompi' => 'Wompi',
            'mercadopago' => 'Mercado Pago',
            'payu' => 'PayU',
            'epayco' => 'ePayco',
        ];

        return $names[$gateway] ?? ucfirst($gateway);
    }

    /**
     * Obtener descripción del gateway
     * 
     * @param string $gateway
     * @param string|null $countryCode
     * @return string
     */
    private function getGatewayDescription(string $gateway, ?string $countryCode = null): string
    {
        $descriptions = [
            'stripe' => 'Tarjetas de crédito/débito internacionales',
            'wompi' => 'PSE, Nequi, tarjetas (Colombia)',
            'mercadopago' => 'Pagos en América Latina',
            'payu' => 'Pagos en Latinoamérica',
            'epayco' => 'Pagos en Colombia',
        ];

        return $descriptions[$gateway] ?? 'Método de pago';
    }

    /**
     * Obtener icono del gateway
     * 
     * @param string $gateway
     * @return string
     */
    private function getGatewayIcon(string $gateway): string
    {
        $icons = [
            'stripe' => 'credit-card',
            'wompi' => 'smartphone',
            'mercadopago' => 'dollar-sign',
            'payu' => 'credit-card',
            'epayco' => 'credit-card',
        ];

        return $icons[$gateway] ?? 'credit-card';
    }

    /**
     * Detectar país del usuario
     * 
     * @param \Illuminate\Http\Request|null $request
     * @return string|null
     */
    public function detectUserCountry($request = null): ?string
    {
        if (!$request) {
            $request = request();
        }

        // 1. Intentar desde el perfil del usuario
        if ($user = $request->user()) {
            if ($user->country) {
                return strtoupper($user->country);
            }
        }

        // 2. Intentar desde la IP (requiere servicio de geolocalización)
        // Implementar según tu servicio preferido (ipapi.co, MaxMind, etc.)
        
        // 3. Usar país por defecto
        return config('payment.country_detection.default_country', 'US');
    }

    /**
     * Convertir precio de USD a moneda local
     * 
     * @param float $usdAmount
     * @param string $countryCode
     * @return array ['amount' => float, 'currency' => string]
     */
    public function convertToLocalCurrency(float $usdAmount, string $countryCode): array
    {
        $currency = config("payment.currencies.{$countryCode}", 'USD');
        
        if ($currency === 'USD') {
            return [
                'amount' => $usdAmount,
                'currency' => 'USD',
            ];
        }

        $exchangeRate = config("payment.exchange_rates.{$currency}", 1);
        $localAmount = $usdAmount * $exchangeRate;

        return [
            'amount' => round($localAmount, 2),
            'currency' => $currency,
        ];
    }
}
