<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class FeatureNotAvailableException extends Exception
{
    protected string $feature;
    protected string $currentPlan;

    public function __construct(string $feature, string $currentPlan, string $message = '', int $code = 403)
    {
        $message = $message ?: "La función '{$feature}' no está disponible en tu plan actual.";
        parent::__construct($message, $code);
        
        $this->feature = $feature;
        $this->currentPlan = $currentPlan;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'error' => 'Feature not available',
            'message' => $this->getMessage(),
            'feature' => $this->feature,
            'current_plan' => $this->currentPlan,
            'feature_locked' => true,
            'upgrade_required' => true,
            'redirect_to' => '/subscription/pricing',
        ], $this->getCode());
    }
}
