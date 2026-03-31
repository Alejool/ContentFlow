<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AddonsController extends Controller
{
    /**
     * Mostrar la página de add-ons disponibles
     */
    public function index()
    {
        try {
            $addons = config('addons');

            // Verificar que la configuración existe
            if (!$addons || !is_array($addons)) {
                \Log::error('Addons config is missing or invalid');
                $addons = [];
            }

            // Asegurar que la estructura existe con valores por defecto
            $addonsData = [
                'ai_credits' => [
                    'enabled' => $addons['ai_credits']['enabled'] ?? true,
                    'packages' => $addons['ai_credits']['packages'] ?? [],
                ],
                'storage' => [
                    'enabled' => $addons['storage']['enabled'] ?? true,
                    'packages' => $addons['storage']['packages'] ?? [],
                ],
                'publications' => [
                    'enabled' => $addons['publications']['enabled'] ?? true,
                    'packages' => $addons['publications']['packages'] ?? [],
                ],
                'team_members' => [
                    'enabled' => $addons['team_members']['enabled'] ?? true,
                    'packages' => $addons['team_members']['packages'] ?? [],
                ],
            ];

            return Inertia::render('Subscription/Addons', [
                'addons' => $addonsData,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading addons page: ' . $e->getMessage());
            
            // Retornar estructura vacía en caso de error
            return Inertia::render('Subscription/Addons', [
                'addons' => [
                    'ai_credits' => ['enabled' => false, 'packages' => []],
                    'storage' => ['enabled' => false, 'packages' => []],
                    'publications' => ['enabled' => false, 'packages' => []],
                    'team_members' => ['enabled' => false, 'packages' => []],
                ],
            ]);
        }
    }

    /**
     * Iniciar el proceso de compra de un add-on
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'sku' => 'required|string',
            'quantity' => 'required|integer|min:1',
        ]);

        $sku = $request->input('sku');
        $quantity = $request->input('quantity');

        // Buscar el paquete en la configuración
        $package = $this->findPackageBySku($sku);

        if (!$package || !$package['enabled']) {
            return back()->with('error', __('El paquete seleccionado no está disponible.'));
        }

        // Aquí iría la lógica de Stripe para crear la sesión de checkout
        // Por ahora, solo redirigimos con un mensaje
        return back()->with('success', __('Proceso de compra iniciado para :name', ['name' => $package['name']]));
    }

    /**
     * Buscar un paquete por su SKU
     */
    private function findPackageBySku(string $sku): ?array
    {
        $addons = config('addons');

        foreach (['ai_credits', 'storage', 'publications', 'team_members'] as $type) {
            if (isset($addons[$type]['packages'][$sku])) {
                return $addons[$type]['packages'][$sku];
            }
        }

        return null;
    }
}
