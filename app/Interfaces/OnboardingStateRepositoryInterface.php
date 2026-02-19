<?php

namespace App\Interfaces;

use App\Models\OnboardingState;

interface OnboardingStateRepositoryInterface
{
    public function find(int $userId): ?OnboardingState;
    
    public function create(int $userId, array $data): OnboardingState;
    
    public function update(int $userId, array $data): OnboardingState;
    
    public function delete(int $userId): bool;
}
