<?php

namespace App\Repositories;

use App\Interfaces\OnboardingStateRepositoryInterface;
use App\Models\OnboardingState;

class OnboardingStateRepository implements OnboardingStateRepositoryInterface
{
    public function find(int $userId): ?OnboardingState
    {
        return OnboardingState::where('user_id', $userId)->first();
    }

    public function create(int $userId, array $data): OnboardingState
    {
        $data['user_id'] = $userId;
        return OnboardingState::create($data);
    }

    public function update(int $userId, array $data): OnboardingState
    {
        $state = $this->find($userId);
        
        if (!$state) {
            return $this->create($userId, $data);
        }
        
        $state->update($data);
        return $state->fresh();
    }

    public function delete(int $userId): bool
    {
        $state = $this->find($userId);
        
        if (!$state) {
            return false;
        }
        
        return $state->delete();
    }

    /**
     * Get completion statistics for analytics
     */
    public function getCompletionStats(): array
    {
        $total = OnboardingState::count();
        $completed = OnboardingState::whereNotNull('completed_at')->count();
        $tourCompleted = OnboardingState::where('tour_completed', true)->count();
        $wizardCompleted = OnboardingState::where('wizard_completed', true)->count();
        $templateSelected = OnboardingState::where('template_selected', true)->count();

        return [
            'total' => $total,
            'completed' => $completed,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
            'tour_completion_rate' => $total > 0 ? round(($tourCompleted / $total) * 100, 2) : 0,
            'wizard_completion_rate' => $total > 0 ? round(($wizardCompleted / $total) * 100, 2) : 0,
            'template_selection_rate' => $total > 0 ? round(($templateSelected / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Get average completion time in seconds
     */
    public function getAverageCompletionTime(): ?float
    {
        $states = OnboardingState::whereNotNull('completed_at')
            ->whereNotNull('started_at')
            ->get();

        if ($states->isEmpty()) {
            return null;
        }

        $totalSeconds = $states->sum(function ($state) {
            return $state->completed_at->diffInSeconds($state->started_at);
        });

        return round($totalSeconds / $states->count(), 2);
    }
}
