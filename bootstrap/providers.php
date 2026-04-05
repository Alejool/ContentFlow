<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
    App\Providers\BroadcastServiceProvider::class,
    App\Providers\HorizonServiceProvider::class,
    App\Providers\CacheServiceProvider::class,
    App\Providers\PaymentServiceProvider::class, // Servicios de pago como Singletons
];
