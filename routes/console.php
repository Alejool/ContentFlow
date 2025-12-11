<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('test:reverb', function () {
    $this->info('Config Broadcasting Default: ' . config('broadcasting.default'));
    $this->info('Env BROADCAST_CONNECTION: ' . env('BROADCAST_CONNECTION'));
    $this->info('Dispatching TestReverbEvent...');
    \App\Events\TestReverbEvent::dispatch('Testing Reverb Connection at ' . now());
    $this->info('Event dispatched! Check your Reverb console and Browser console.');
})->purpose('Test Reverb Broadcasting');
