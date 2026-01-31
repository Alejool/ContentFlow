<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Publications\Publication;
use App\Models\Campaigns\Campaign;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Creating test data...');

        // Get existing user (Alejandro)
        $user = User::where('email', 'alejandroolartediaz@gmail.com')->first();

        if (!$user) {
            $this->command->error('User not found!');
            return;
        }

        // Create 10 test publications
        $this->command->info('Creating publications...');
        $publications = [];
        for ($i = 1; $i <= 10; $i++) {
            $publication = Publication::create([
                'user_id' => $user->id,
                'title' => "Publicación de Prueba #{$i}",
                'slug' => Str::slug("Publicación de Prueba #{$i}"),
                'description' => "Esta es una descripción de prueba para la publicación #{$i}",
                'body' => "Contenido completo de la publicación #{$i}. Este es un texto de ejemplo para demostrar cómo se vería una publicación real.",
                'status' => $i % 3 == 0 ? 'published' : 'draft',
                'hashtags' => '#prueba #test #publicacion' . $i,
                'goal' => 'Aumentar engagement',
                'start_date' => now()->subDays(30 - $i),
                'end_date' => now()->addDays($i * 2),
                'publish_date' => now()->subDays(20 - $i),
                'scheduled_at' => now()->addDays($i),
                'created_at' => now()->subDays(30 - $i),
                'updated_at' => now()->subDays(15 - $i),
            ]);
            $publications[] = $publication;
        }
        $this->command->info('Created ' . count($publications) . ' publications');

        // Create 3 test campaigns
        $this->command->info('Creating campaigns...');
        $campaigns = [];
        for ($i = 1; $i <= 3; $i++) {
            $campaign = Campaign::create([
                'user_id' => $user->id,
                'name' => "Campaña de Marketing #{$i}",
                'description' => "Campaña de prueba #{$i} para agrupar publicaciones relacionadas",
                'status' => ['active', 'draft', 'paused'][$i - 1],
                'goal' => 'Incrementar ventas y awareness',
                'budget' => 1000 * $i,
                'start_date' => now()->subDays(20),
                'end_date' => now()->addDays(30),
                'created_at' => now()->subDays(25),
            ]);

            // Attach 3-4 publications to each campaign
            $pubsToAttach = array_slice($publications, ($i - 1) * 3, 3);
            foreach ($pubsToAttach as $index => $pub) {
                $campaign->publications()->attach($pub->id, ['order' => $index + 1]);
            }

            $campaigns[] = $campaign;
        }
        $this->command->info('Created ' . count($campaigns) . ' campaigns');

        // Create analytics data for publications
        $this->command->info('Creating analytics data...');
        foreach ($publications as $publication) {
            if ($publication->status === 'published') {
                for ($day = 0; $day < 7; $day++) {
                    DB::table('campaign_analytics')->insert([
                        'publication_id' => $publication->id,
                        'user_id' => $user->id,
                        'platform' => ['facebook', 'twitter', 'instagram'][rand(0, 2)],
                        'date' => now()->subDays($day),
                        'views' => rand(100, 1000),
                        'clicks' => rand(10, 100),
                        'conversions' => rand(1, 20),
                        'reach' => rand(500, 5000),
                        'impressions' => rand(1000, 10000),
                        'likes' => rand(10, 200),
                        'comments' => rand(5, 50),
                        'shares' => rand(2, 30),
                        'saves' => rand(1, 20),
                        'engagement_rate' => rand(100, 500) / 100,
                        'ctr' => rand(50, 300) / 100,
                        'conversion_rate' => rand(10, 100) / 100,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
        $this->command->info('Created analytics data');

        $this->command->info('✅ Test data creation completed!');
        $this->command->info('Publications: ' . Publication::count());
        $this->command->info('Campaigns: ' . Campaign::count());
        $this->command->info('Analytics records: ' . DB::table('campaign_analytics')->count());
    }
}
