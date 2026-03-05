<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class LimitReachedException extends Exception
{
    protected array $upgradeMessage;

    public function __construct(string $message, array $upgradeMessage = [], int $code = 403)
    {
        parent::__construct($message, $code);
        $this->upgradeMessage = $upgradeMessage;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'error' => 'Limit reached',
            'message' => $this->getMessage(),
            'upgrade_required' => true,
            'upgrade_message' => $this->upgradeMessage,
            'redirect_to' => '/subscription/pricing',
        ], $this->getCode());
    }

    public function getUpgradeMessage(): array
    {
        return $this->upgradeMessage;
    }
}
