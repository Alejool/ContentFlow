<?php

namespace Database\Seeders\Social;

use App\Models\Campaigns\Campaign;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    public function run()
    {
        Campaign::create([
            'user_id' => 1,
            'title' => 'Campaña de Ejemplo',
            'slug' => 'campana-ejemplo',
            'status' => 'published',
        ]);

        Campaign::factory(20)->create();
    }
}
