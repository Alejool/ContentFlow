<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class LimitReachedException extends Exception
{
    protected array $context;

    public function __construct(string $message, array $context = [], int $code = 403)
    {
        parent::__construct($message, $code);
        $this->context = $context;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'error' => 'Limit Reached',
            'message' => $this->getMessage(),
            'limit_type' => $this->context['limit_type'] ?? null,
            'current_plan' => $this->context['current_plan'] ?? null,
            'limit' => $this->context['limit'] ?? null,
            'workspace_id' => $this->context['workspace_id'] ?? null,
            'workspace_name' => $this->context['workspace_name'] ?? null,
            'upgrade_required' => $this->context['upgrade_required'] ?? true,
            'available_plans' => $this->getAvailablePlans($this->context['current_plan'] ?? 'free'),
            'redirect_to' => '/subscription/pricing',
        ], $this->getCode());
    }

    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * Get available upgrade plans.
     */
    private function getAvailablePlans(string $currentPlan): array
    {
        $planHierarchy = ['free', 'starter', 'growth', 'professional', 'enterprise'];
        $currentIndex = array_search($currentPlan, $planHierarchy);
        
        if ($currentIndex === false) {
            return [];
        }
        
        $availablePlans = [];
        for ($i = $currentIndex + 1; $i < count($planHierarchy); $i++) {
            $plan = $planHierarchy[$i];
            $config = config("plans.{$plan}");
            
            if ($config) {
                $availablePlans[] = [
                    'plan' => $plan,
                    'name' => $config['name'],
                    'price' => $config['price'],
                ];
            }
        }
        
        return $availablePlans;
    }
}
