<?php

namespace App\Helpers;

class AddonHelper
{
    /**
     * Buscar un addon por SKU en todas las categorías
     * 
     * @param string $sku
     * @return array|null
     */
    public static function findBySku(string $sku): ?array
    {
        $addonsConfig = config('addons', []);
        
        // Buscar en todas las categorías (ai_credits, storage, publications, team_members)
        foreach ($addonsConfig as $category => $categoryData) {
            if ($category === 'settings') {
                continue; // Saltar la configuración general
            }
            
            if (isset($categoryData['packages'][$sku])) {
                return $categoryData['packages'][$sku];
            }
        }
        
        return null;
    }

    /**
     * Obtener todos los paquetes de addons en un array plano
     * 
     * @return array
     */
    public static function getAllPackages(): array
    {
        $addonsConfig = config('addons', []);
        $allPackages = [];
        
        foreach ($addonsConfig as $category => $categoryData) {
            if ($category === 'settings') {
                continue;
            }
            
            if (isset($categoryData['packages']) && is_array($categoryData['packages'])) {
                $allPackages = array_merge($allPackages, $categoryData['packages']);
            }
        }
        
        return $allPackages;
    }

    /**
     * Verificar si un addon está disponible
     * 
     * @param string $sku
     * @return bool
     */
    public static function isAvailable(string $sku): bool
    {
        $addon = self::findBySku($sku);
        
        if (!$addon) {
            return false;
        }
        
        return $addon['enabled'] ?? true;
    }
}
