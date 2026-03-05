<?php

namespace App\Services\Analytics;

use App\Models\Subscription\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SaasMetricsService
{
    public function getMRR(): float
    {
        return Cache::remember('saas.metrics.mrr', now()->addHours(1), function () {
            return Subscription::where('status', 'active')
                ->get()
                ->sum(function ($subscription) {
                    return config("plans.{$subscription->plan}.price", 0);
                });
        });
    }

    public function getARR(): float
    {
        return $this->getMRR() * 12;
    }

    public function getChurnRate(string $period = 'month'): float
    {
        $startDate = now()->startOf($period);
        $endDate = now()->endOf($period);

        $startCount = Subscription::where('created_at', '<', $startDate)
            ->where('status', 'active')
            ->count();

        $canceledCount = Subscription::whereBetween('ends_at', [$startDate, $endDate])
            ->whereIn('status', ['canceled', 'past_due'])
            ->count();

        return $startCount > 0 ? ($canceledCount / $startCount) * 100 : 0;
    }

    public function getARPU(): float
    {
        $totalRevenue = $this->getMRR();
        $activeUsers = Subscription::where('status', 'active')->count();

        return $activeUsers > 0 ? $totalRevenue / $activeUsers : 0;
    }

    public function getLTV(): float
    {
        $arpu = $this->getARPU();
        $churnRate = $this->getChurnRate() / 100;

        return $churnRate > 0 ? $arpu / $churnRate : 0;
    }

    public function getConversionRate(): float
    {
        $totalUsers = User::count();
        $paidUsers = Subscription::where('status', 'active')
            ->where('plan', '!=', 'free')
            ->count();

        return $totalUsers > 0 ? ($paidUsers / $totalUsers) * 100 : 0;
    }

    public function getPlanDistribution(): array
    {
        return Cache::remember('saas.metrics.plan_distribution', now()->addHours(1), function () {
            return Subscription::where('status', 'active')
                ->select('plan', DB::raw('count(*) as count'))
                ->groupBy('plan')
                ->get()
                ->pluck('count', 'plan')
                ->toArray();
        });
    }

    public function getTrialConversionRate(): float
    {
        $totalTrials = Subscription::where('trial_ends_at', '<', now())
            ->whereNotNull('trial_ends_at')
            ->count();

        $convertedTrials = Subscription::where('trial_ends_at', '<', now())
            ->whereNotNull('trial_ends_at')
            ->where('status', 'active')
            ->whereNotNull('stripe_subscription_id')
            ->count();

        return $totalTrials > 0 ? ($convertedTrials / $totalTrials) * 100 : 0;
    }

    public function getActiveSubscriptions(): int
    {
        return Subscription::where('status', 'active')->count();
    }

    public function getTrialSubscriptions(): int
    {
        return Subscription::where('status', 'trialing')
            ->where('trial_ends_at', '>', now())
            ->count();
    }

    public function getAllMetrics(): array
    {
        return [
            'mrr' => $this->getMRR(),
            'arr' => $this->getARR(),
            'churn_rate' => $this->getChurnRate(),
            'arpu' => $this->getARPU(),
            'ltv' => $this->getLTV(),
            'conversion_rate' => $this->getConversionRate(),
            'trial_conversion_rate' => $this->getTrialConversionRate(),
            'active_subscriptions' => $this->getActiveSubscriptions(),
            'trial_subscriptions' => $this->getTrialSubscriptions(),
            'plan_distribution' => $this->getPlanDistribution(),
        ];
    }
}
