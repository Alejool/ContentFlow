<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanFakeSubscriptions extends Command
{
    protected $signature = 'subscription:clean-fake';
    
    protected $description = 'Elimina suscripciones con stripe_id inválido (que no empiezan con sub_)';

    public function handle()
    {
        $this->info('Buscando suscripciones con stripe_id inválido...');
        
        $fakeSubscriptions = DB::table('subscriptions')
            ->where('stripe_id', 'NOT LIKE', 'sub_%')
            ->get();

        if ($fakeSubscriptions->isEmpty()) {
            $this->info('No se encontraron suscripciones falsas');
            return 0;
        }

        $this->info("Se encontraron {$fakeSubscriptions->count()} suscripciones falsas:");
        
        foreach ($fakeSubscriptions as $sub) {
            $this->line("  ID: {$sub->id}, Stripe ID: {$sub->stripe_id}, User ID: {$sub->user_id}");
        }

        if ($this->confirm('¿Deseas eliminar estas suscripciones?', true)) {
            $deleted = DB::table('subscriptions')
                ->where('stripe_id', 'NOT LIKE', 'sub_%')
                ->delete();

            $this->info("✓ {$deleted} suscripciones eliminadas");
            return 0;
        }

        $this->info('Operación cancelada');
        return 0;
    }
}
