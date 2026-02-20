<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tour Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the guided tour feature
    |
    */
    'tour_steps' => env('ONBOARDING_TOUR_STEPS', 6),

    /*
    |--------------------------------------------------------------------------
    | Wizard Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the setup wizard
    |
    */
    'wizard_steps' => env('ONBOARDING_WIZARD_STEPS', 3),

    /*
    |--------------------------------------------------------------------------
    | Tooltip Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for contextual tooltips
    |
    */
    'tooltip_auto_hide_delay' => env('ONBOARDING_TOOLTIP_DELAY', 5000), // milliseconds
    'tooltip_show_on_hover' => env('ONBOARDING_TOOLTIP_HOVER', true),

    /*
    |--------------------------------------------------------------------------
    | Analytics Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for onboarding analytics tracking
    |
    */
    'analytics_enabled' => env('ONBOARDING_ANALYTICS_ENABLED', true),
];
