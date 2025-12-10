<?php

namespace Database\Seeders;

use App\Models\Campaign;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    public function run()
    {
        // Campañas específicas (ejemplo)
        Campaign::create([
            'user_id' => 1,
            'title' => 'Campaña de Ejemplo',
            'slug' => 'campana-ejemplo',
            'status' => 'published',
            // ... otros campos
        ]);

        // O usar el factory
        Campaign::factory(20)->create();
    }
}
