<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

use App\Models\User;
use App\Models\Publications\Publication;
use App\Models\Campaigns\CampaignAnalytics;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialMediaMetrics;
use App\Models\Workspace\Workspace;

class ExistingUserDummyDataSeeder extends Seeder
{
  /**
   * Run the database seeder.
   */
  public function run(): void
  {
    // Ensure we have some test users first
    $testUsers = [
      ['name' => 'Demo User', 'email' => 'demo@gmail.com'],
      ['name' => 'Admin User', 'email' => 'admin@gmail.com'],
      ['name' => 'Test User', 'email' => 'test@example.com'],
    ];

    foreach ($testUsers as $testUser) {
      if (!User::where('email', $testUser['email'])->exists()) {
        $this->command->info("Creating test user: {$testUser['email']}");
        User::create([
          'name' => $testUser['name'],
          'email' => $testUser['email'],
          'password' => bcrypt('password'),
          'email_verified_at' => now(),
        ]);
      }
    }

    $users = User::all();
    $this->command->info("Found {$users->count()} users. Generating data...");


    foreach ($users as $user) {
      $this->command->info("Processing user: {$user->email}");

      // Ensure user has a workspace (create one if missing or use default)
      $workspaceId = $user->current_workspace_id;
      if (!$workspaceId) {
        $workspace = $user->workspaces()->first();
        if ($workspace) {
          $workspaceId = $workspace->id;
          $user->update(['current_workspace_id' => $workspaceId]);
        } else {
          // Try to Create a default workspace if none exists
          $this->command->warn("User {$user->email} has no workspace. running WorkspaceSeeder for this user...");

          // Create a personal workspace for this user manually since they don't have one
          $workspace = Workspace::create([
            'name' => 'Personal Workspace',
            'slug' => Str::slug($user->name . ' Personal ' . Str::random(4)),
            'created_by' => $user->id,
          ]);

          // Attach implicitly (assuming role pivot existence, or just setting ID for now to pass foreign key checks)
          // If creating a fresh workspace, we should probably attach the user as owner.
          // But for dummy data, setting the ID is crucial for the publications relationship.
          $user->workspaces()->attach($workspace->id, ['role_id' => 1]); // Assuming 1 is Owner or similar, or just attach
          $user->update(['current_workspace_id' => $workspace->id]);
          $workspaceId = $workspace->id;
        }
      }

      $this->createPublicationsAndAnalytics($user, $workspaceId);
      $this->createSocialAccountsAndMetrics($user, $workspaceId);
    }

    $this->command->info('✅ Dummy data generation completed for all users!');
  }

  private function createPublicationsAndAnalytics($user, $workspaceId)
  {
    // Detailed publication templates with realistic content
    $publicationTemplates = [
      [
        'title' => 'Summer Sale 2025 - Up to 50% Off',
        'body' => "🌞 ¡El verano está aquí y nuestras ofertas también! 🔥\n\nDisfruta de descuentos increíbles en toda nuestra colección de verano. Desde ropa de playa hasta accesorios frescos, tenemos todo lo que necesitas para brillar esta temporada.\n\n✨ Ofertas destacadas:\n• Trajes de baño: 40% OFF\n• Gafas de sol: 30% OFF\n• Sandalias: 50% OFF\n\n¡No te lo pierdas! Oferta válida hasta fin de mes.",
        'hashtags' => ['summer', 'sale', 'fashion', 'discount', 'shopping', 'summerstyle', 'beachwear', 'deals'],
        'goal' => 'Incrementar ventas de verano en un 35%',
        'url' => 'https://example.com/summer-sale',
      ],
      [
        'title' => 'Winter Collection Launch - New Arrivals',
        'body' => "❄️ Nueva Colección de Invierno Ya Disponible ❄️\n\nDescubre las últimas tendencias en moda invernal. Diseños exclusivos que combinan estilo y comodidad para mantenerte abrigado con clase.\n\n🧥 Lo nuevo:\n• Abrigos premium de lana\n• Suéteres de cachemira\n• Botas impermeables de diseño\n• Accesorios térmicos elegantes\n\nCompra ahora y recibe envío gratis en pedidos superiores a $100.",
        'hashtags' => ['winter', 'fashion', 'newcollection', 'winterstyle', 'cozy', 'winterfashion', 'newarrivals', 'style'],
        'goal' => 'Lanzamiento exitoso con 500+ ventas en primera semana',
        'url' => 'https://example.com/winter-collection',
      ],
      [
        'title' => 'Tech Gadgets Promo - Smart Living',
        'body' => "🚀 Tecnología que Transforma tu Vida 📱\n\n¿Listo para actualizar tu setup? Tenemos los gadgets más innovadores del mercado con precios especiales.\n\n💡 Destacados:\n• Smartwatches última generación\n• Auriculares con cancelación de ruido\n• Cargadores inalámbricos rápidos\n• Accesorios gaming profesionales\n\n🎁 BONUS: Garantía extendida gratis en compras mayores a $200\n\n#TechLife #Innovation",
        'hashtags' => ['tech', 'gadgets', 'technology', 'innovation', 'smartliving', 'electronics', 'techdeals', 'geek'],
        'goal' => 'Posicionar marca en segmento tech con 1000+ impresiones',
        'url' => 'https://example.com/tech-promo',
      ],
      [
        'title' => 'Organic Food Awareness Campaign',
        'body' => "🌱 Alimentación Consciente, Vida Saludable 🥗\n\nÚnete al movimiento de comida orgánica y descubre cómo pequeños cambios en tu dieta pueden transformar tu bienestar.\n\n🍎 Beneficios de lo orgánico:\n✓ Sin pesticidas ni químicos\n✓ Mayor valor nutricional\n✓ Sabor auténtico y natural\n✓ Apoyas agricultura sostenible\n\nVisita nuestra tienda y encuentra productos 100% orgánicos certificados. Tu salud y el planeta te lo agradecerán. 🌍💚",
        'hashtags' => ['organic', 'healthyfood', 'wellness', 'sustainable', 'eatclean', 'organicfood', 'healthylifestyle', 'nutrition'],
        'goal' => 'Educar audiencia sobre alimentación orgánica - 5000 alcance',
        'url' => 'https://example.com/organic-food',
      ],
      [
        'title' => 'Fitness Challenge - 30 Days Transformation',
        'body' => "💪 Desafío Fitness de 30 Días - ¡Transforma Tu Cuerpo! 🏋️\n\n¿Estás listo para el cambio? Únete a nuestro desafío de transformación y alcanza tus metas fitness.\n\n📋 Incluye:\n• Plan de entrenamiento personalizado\n• Guía nutricional completa\n• Seguimiento diario con coach\n• Comunidad de apoyo 24/7\n• Premios para los mejores resultados\n\n🎯 Comienza HOY y ve resultados reales en 30 días.\n\n¡Tu mejor versión te está esperando!",
        'hashtags' => ['fitness', 'workout', 'challenge', 'transformation', 'health', 'fitnessmotivation', 'gym', 'healthylifestyle'],
        'goal' => 'Conseguir 200 participantes en el desafío',
        'url' => 'https://example.com/fitness-challenge',
      ],
      [
        'title' => 'Black Friday Mega Deal - Limited Time',
        'body' => "🖤 BLACK FRIDAY ESTÁ AQUÍ 🛍️\n\n¡Las ofertas más esperadas del año! Descuentos de hasta 70% en productos seleccionados.\n\n⚡ OFERTAS RELÁMPAGO:\n• Electrónica: hasta 60% OFF\n• Moda: hasta 70% OFF\n• Hogar: hasta 50% OFF\n• Deportes: hasta 55% OFF\n\n⏰ Solo por 48 horas\n🚚 Envío express gratis\n💳 12 meses sin intereses\n\n¡Corre! Las mejores ofertas se agotan rápido.",
        'hashtags' => ['blackfriday', 'sale', 'deals', 'shopping', 'discount', 'blackfridaydeals', 'offers', 'savings'],
        'goal' => 'Maximizar ventas - objetivo $50,000 en 48 horas',
        'url' => 'https://example.com/black-friday',
      ],
      [
        'title' => 'New Year Resolution - Fresh Start 2025',
        'body' => "🎆 Nuevo Año, Nueva Tú ✨\n\n2025 es tu año para brillar. Te ayudamos a cumplir tus propósitos con nuestros programas especiales de inicio de año.\n\n🎯 Propósitos más populares:\n• Vida más saludable → Planes wellness\n• Mejor forma física → Membresías gym\n• Desarrollo personal → Cursos online\n• Organización → Planners y apps\n\n🎁 OFERTA ESPECIAL: 30% OFF en todos los programas anuales durante enero.\n\nEmpieza el año con el pie derecho. ¡Tú puedes lograrlo! 💫",
        'hashtags' => ['newyear', 'resolution', 'goals', 'motivation', 'freshstart', 'newyearnewyou', 'selfimprovement', '2025'],
        'goal' => 'Engagement alto - 10,000 interacciones en enero',
        'url' => 'https://example.com/new-year',
      ],
      [
        'title' => 'Sustainable Fashion - Eco Friendly Style',
        'body' => "🌿 Moda Sostenible: Estilo con Conciencia 👗\n\nLa moda puede ser hermosa Y responsable. Descubre nuestra línea eco-friendly hecha con materiales reciclados y procesos sostenibles.\n\n♻️ Nuestro compromiso:\n• 100% algodón orgánico\n• Tintes naturales biodegradables\n• Packaging compostable\n• Producción ética certificada\n\nCada compra planta un árbol 🌳\n\nViste bien, siente mejor, cuida el planeta.",
        'hashtags' => ['sustainable', 'ecofriendly', 'sustainablefashion', 'ethical', 'green', 'slowfashion', 'conscious', 'zerowaste'],
        'goal' => 'Posicionar marca como líder en moda sostenible',
        'url' => 'https://example.com/sustainable-fashion',
      ],
    ];

    // Create exactly 10 publications per user with richer test data
    $count = 10;
    $campaignPool = [];

    for ($i = 0; $i < $count; $i++) {
      $template = $publicationTemplates[array_rand($publicationTemplates)];
      
      $title = $template['title'] . ' - ' . Str::random(4);
      $startDate = Carbon::now()->subDays(rand(10, 90));
      $endDate = $startDate->copy()->addDays(rand(7, 60));

      // 40% chance to be part of a campaign grouping
      $isCampaign = rand(1, 100) <= 40;
      $campaignName = null;
      if ($isCampaign) {
        if (rand(1, 100) <= 60 && !empty($campaignPool)) {
          $campaignName = $campaignPool[array_rand($campaignPool)];
        } else {
          $campaignName = Str::title(Str::random(6)) . ' Campaign';
          $campaignPool[] = $campaignName;
        }
      }

      $goal = $isCampaign ? "Campaign: {$campaignName} - " . $template['goal'] : $template['goal'];
      $description = ($isCampaign ? "Parte de la campaña {$campaignName}. " : '') . 
                     "Publicación de prueba con contenido detallado y hashtags relevantes.";

      // Random status distribution
      $statusOptions = ['published', 'published', 'published', 'scheduled', 'draft', 'approved'];
      $status = $statusOptions[array_rand($statusOptions)];

      // Platform settings with detailed configuration
      $platformSettings = [
        'facebook' => [
          'enabled' => rand(0, 1) === 1,
          'post_type' => ['status', 'photo', 'link'][rand(0, 2)],
          'target_audience' => ['all', '18-35', '25-45'][rand(0, 2)],
        ],
        'instagram' => [
          'enabled' => rand(0, 1) === 1,
          'post_type' => ['feed', 'story', 'reel'][rand(0, 2)],
          'location' => ['New York', 'Los Angeles', 'Miami', null][rand(0, 3)],
        ],
        'twitter' => [
          'enabled' => rand(0, 1) === 1,
          'thread' => rand(0, 1) === 1,
          'reply_settings' => ['everyone', 'following', 'mentioned'][rand(0, 2)],
        ],
        'linkedin' => [
          'enabled' => rand(0, 1) === 1,
          'visibility' => ['public', 'connections'][rand(0, 1)],
        ],
      ];

      $publication = Publication::create([
        'user_id' => $user->id,
        'workspace_id' => $workspaceId,
        'title' => $title,
        'slug' => Str::slug($title . '-' . Str::random(4)),
        'status' => $status,
        'goal' => $goal,
        'body' => $template['body'],
        'description' => $description,
        'hashtags' => $template['hashtags'],
        'url' => $template['url'],
        'platform_settings' => $platformSettings,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'publish_date' => $startDate,
        'published_at' => $status === 'published' ? $startDate : null,
        'published_by' => $status === 'published' ? $user->id : null,
        'approved_at' => in_array($status, ['published', 'approved', 'scheduled']) ? $startDate->copy()->subHours(2) : null,
        'approved_by' => in_array($status, ['published', 'approved', 'scheduled']) ? $user->id : null,
      ]);

      // Create an activity record for the publication creation if an activities table exists
      try {
        if (Schema::hasTable('activities')) {
          DB::table('activities')->insert([
            'user_id' => $user->id,
            'subject_type' => Publication::class,
            'subject_id' => $publication->id,
            'description' => "Created publication {$publication->title}",
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
          ]);
        }
      } catch (\Throwable $e) {
        // ignore if activity table has different schema
      }

      // Generate Analytics for published publications
      if ($status === 'published') {
        $this->generateCampaignAnalytics($publication, $isCampaign);
      }
    }
  }

  private function generateCampaignAnalytics($publication, $isCampaign = false)
  {
    $currentDate = $publication->start_date->copy();
    $endDate = $publication->end_date->copy()->min(Carbon::now()); // Don't generate future data yet

    // Campaigns tend to have higher baseline
    $baseViews = $isCampaign ? rand(500, 3000) : rand(100, 1000);

    while ($currentDate <= $endDate) {
      $isWeekend = $currentDate->isWeekend();
      $multiplier = $isWeekend ? 0.6 : 1.1;

      // Randomize daily stats
      $views = (int) ($baseViews * $multiplier * (rand(80, 120) / 100));
      $clicks = (int) ($views * (rand(2, 10) / 100));
      $conversions = (int) ($clicks * (rand(5, 20) / 100));
      $likes = (int) ($views * (rand(5, 15) / 100));
      $comments = (int) ($likes * (rand(5, 20) / 100));
      $shares = (int) ($likes * (rand(2, 10) / 100));
      $saves = (int) ($likes * (rand(1, 5) / 100));

      CampaignAnalytics::create([
        'publication_id' => $publication->id, // IMPORTANT: Using publication_id
        'user_id' => $publication->user_id,
        'date' => $currentDate->format('Y-m-d'),
        'views' => $views,
        'clicks' => $clicks,
        'conversions' => $conversions,
        'likes' => $likes,
        'comments' => $comments,
        'shares' => $shares,
        'saves' => $saves,
        'reach' => (int) ($views * (rand(80, 95) / 100)),
        'impressions' => (int) ($views * (rand(110, 140) / 100)),
        'engagement_rate' => $views > 0 ? round((($likes + $comments + $shares + $saves) / $views) * 100, 2) : 0,
        'ctr' => $views > 0 ? round(($clicks / $views) * 100, 2) : 0,
        'conversion_rate' => $clicks > 0 ? round(($conversions / $clicks) * 100, 2) : 0,
      ]);

      $currentDate->addDay();

      // Slightly trend the base views up or down
      $baseViews = $baseViews * (rand(95, 105) / 100);
    }
  }

  private function createSocialAccountsAndMetrics($user, $workspaceId)
  {
    // Read active social platforms from config if available, otherwise fallback
    $platforms = config('social.platforms', ['facebook', 'youtube', 'twitter', 'tiktok']);

    foreach ($platforms as $platform) {
      // Check if account already exists to avoid duplicates
      $account = SocialAccount::firstOrCreate(
        [
          'user_id' => $user->id,
          'workspace_id' => $workspaceId,
          'platform' => $platform
        ],
        [
          'account_id' => 'test_' . $platform . '_' . $user->id,
          'account_name' => "Test $platform Account",
          'access_token' => 'dummy_token',
          'refresh_token' => 'dummy_refresh'
        ]
      );

      // Generate Social Media Metrics for last 90 days
      $this->generateSocialMetrics($account);
    }
  }

  private function generateSocialMetrics($account)
  {
    // Clean up old metrics for this test period to avoid collision if running specific ranges?
    // Or just add new ones? Ideally `firstOrCreate` or just add.
    // For simplicity and preventing Primary Key collisions on (account_id, date) if unique constrained:
    // Let's first check if metrics exist for today.

    $startDate = Carbon::now()->subDays(90);
    $currentDate = $startDate->copy();

    $followers = rand(1000, 50000);

    while ($currentDate <= Carbon::now()) {

      // Check if metric exists
      $exists = SocialMediaMetrics::where('social_account_id', $account->id)
        ->where('date', $currentDate->format('Y-m-d'))
        ->exists();

      if (!$exists) {
        $isWeekend = $currentDate->isWeekend();
        $dailyGrowth = rand(-5, 20); // Can lose followers too
        $followers += $dailyGrowth;
        if ($followers < 0) $followers = 0;

        $posts = $isWeekend ? rand(0, 1) : rand(0, 3);
        $views = rand(100, 500) * ($posts + 1);

        SocialMediaMetrics::create([
          'social_account_id' => $account->id,
          'user_id' => $account->user_id,
          'date' => $currentDate->format('Y-m-d'),
          'followers' => $followers,
          'following' => rand(100, 500),
          'posts_count' => $posts, // Daily posts
          'total_likes' => (int) ($views * 0.1),
          'total_comments' => (int) ($views * 0.05),
          'total_shares' => (int) ($views * 0.02),
          'engagement_rate' => rand(1, 10),
        ]);
      }

      $currentDate->addDay();
    }
  }
}
