<?php
// Simple script to initialize onboarding for current user
// Access via: http://localhost/init-onboarding.php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Start session
session_start();

// Get user ID from session
$userId = $_SESSION['laravel_session'] ?? null;

if (!$userId) {
    echo "No user session found. Please login first.";
    exit;
}

// Get user
$user = App\Models\User::find($userId);

if (!$user) {
    echo "User not found.";
    exit;
}

// Initialize onboarding
$onboardingService = app(\App\Services\OnboardingService::class);
$state = $onboardingService->initializeOnboarding($user);

echo "Onboarding initialized for user {$user->email}<br>";
echo "Tour current step: {$state->tour_current_step}<br>";
echo "Wizard current step: {$state->wizard_current_step}<br>";
echo "<br><a href='/dashboard'>Go to Dashboard</a>";
