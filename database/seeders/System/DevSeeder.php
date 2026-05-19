<?php

namespace Database\Seeders;

use App\Models\Campaigns\Campaign;
use App\Models\Campaigns\CampaignAnalytics;
use App\Models\Auth\Permission;
use App\Models\Publications\Publication;
use App\Models\Auth\Role;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialMediaMetrics;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * DevSeeder — Un solo comando para levantar el entorno de desarrollo con:
 *   - Roles y permisos (RolesAndPermissionsSeeder)
 *   - Configuración de suscripciones (SubscriptionControlSeeder)
 *   - 1 usuario de prueba con workspace propio (rol Owner)
 *   - 5 cuentas de redes sociales simuladas (facebook, instagram, twitter, tiktok, youtube)
 *   - 90 días de métricas de redes sociales con datos realistas
 *   - 3 campañas de ejemplo
 *   - 15 publicaciones de ejemplo con analytics completos
 *
 * Uso (dentro del contenedor app):
 *   php artisan db:seed --class=DevSeeder
 *
 * Es IDEMPOTENTE: puedes correrlo múltiples veces sin duplicar datos.
 */
class DevSeeder extends Seeder
{
    // Credenciales del usuario de prueba — cámbialas si quieres
    const TEST_EMAIL    = 'dev@contentflow.test';
    const TEST_PASSWORD = 'password';
    const TEST_NAME     = 'Dev User';

    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════╗');
        $this->command->info('║       ContentFlow DevSeeder      ║');
        $this->command->info('╚══════════════════════════════════╝');
        $this->command->info('');

        // ── 1. Roles y permisos ────────────────────────────────────────
        $this->command->info('▶  Roles y permisos...');
        $this->call(RolesAndPermissionsSeeder::class);

        // ── 2. Configuración de suscripciones ─────────────────────────
        $this->command->info('▶  Configuración de suscripciones...');
        $this->call(SubscriptionControlSeeder::class);

        // ── 3. Usuarios de prueba ──────────────────────────────────────
        $this->command->info('▶  Usuarios de prueba...');
        $testUsers = [
            [
                'name' => 'Dev User',
                'email' => 'dev@contentflow.test',
                'photo_url' => 'https://i.pravatar.cc/150?img=1',
                'bio' => 'Usuario de desarrollo para testing',
                'timezone' => 'America/Mexico_City',
            ],
            [
                'name' => 'María García',
                'email' => 'maria@contentflow.test',
                'photo_url' => 'https://i.pravatar.cc/150?img=2',
                'bio' => 'Social Media Manager especializada en estrategias de contenido digital',
                'timezone' => 'America/Mexico_City',
            ],
            [
                'name' => 'Carlos Rodríguez',
                'email' => 'carlos@contentflow.test',
                'photo_url' => 'https://i.pravatar.cc/150?img=12',
                'bio' => 'Director de Marketing Digital con 10+ años de experiencia',
                'timezone' => 'America/Bogota',
            ],
            [
                'name' => 'Ana Martínez',
                'email' => 'ana@contentflow.test',
                'photo_url' => 'https://i.pravatar.cc/150?img=5',
                'bio' => 'Content Creator y Community Manager',
                'timezone' => 'Europe/Madrid',
            ],
        ];

        $createdCount = 0;
        $existingCount = 0;

        foreach ($testUsers as $testUser) {
            if (!User::where('email', $testUser['email'])->exists()) {
                User::create([
                    'name' => $testUser['name'],
                    'email' => $testUser['email'],
                    'password' => Hash::make(self::TEST_PASSWORD),
                    'email_verified_at' => now(),
                    'photo_url' => $testUser['photo_url'],
                    'bio' => $testUser['bio'],
                    'timezone' => $testUser['timezone'],
                ]);
                $createdCount++;
            } else {
                $existingCount++;
            }
        }

        $this->command->info("   ✅ {$createdCount} usuarios creados, {$existingCount} ya existían");

        // ── 4. Workspaces y datos para cada usuario ────────────────────
        $this->command->info('▶  Workspaces...');
        $ownerRole = Role::where('slug', 'owner')->first();

        if (!$ownerRole) {
            $this->command->error('   ❌ Rol "owner" no encontrado.');
            return;
        }

        $users = User::all();
        $wsCreatedCount = 0;

        foreach ($users as $user) {
            if (!$user->workspaces()->exists()) {
                $workspace = Workspace::create([
                    'name'       => $user->name . "'s Workspace",
                    'slug'       => Str::slug($user->name . '-workspace-' . Str::random(4)),
                    'created_by' => $user->id,
                ]);

                $user->workspaces()->attach($workspace->id, ['role_id' => $ownerRole->id]);
                $user->update(['current_workspace_id' => $workspace->id]);
                $wsCreatedCount++;
            } else {
                $workspace = $user->workspaces()->first();
                if (!$user->current_workspace_id) {
                    $user->update(['current_workspace_id' => $workspace->id]);
                }
            }
        }

        $this->command->info("   ✅ {$wsCreatedCount} workspaces creados");

        // ── 5. Generar datos para cada usuario ──────────────────────────
        foreach ($users as $user) {
            $workspaceId = $user->fresh()->current_workspace_id;

            $this->command->info("▶  Procesando usuario: {$user->email}");

            // Redes sociales
            $this->seedSocialAccounts($user, $workspaceId);

            // Métricas de redes sociales
            $this->seedSocialMetrics($user, $workspaceId);

            // Campañas
            $this->seedCampaigns($user, $workspaceId);

            // Publicaciones y analytics
            $this->seedPublications($user, $workspaceId);
        }

        // ── Resumen ────────────────────────────────────────────────────
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════╗');
        $this->command->info('║              ✅ DevSeeder completado                     ║');
        $this->command->info('╠══════════════════════════════════════════════════════════╣');
        $this->command->info('║  Usuarios      : ' . str_pad(User::count() . ' usuarios creados', 42) . '║');
        $this->command->info('║  Password      : ' . str_pad(self::TEST_PASSWORD, 42) . '║');
        $this->command->info('║  Roles         : ' . str_pad(Role::count() . ' roles, ' . Permission::count() . ' permisos', 42) . '║');
        $this->command->info('║  Social cuentas: ' . str_pad(SocialAccount::count() . ' cuentas totales', 42) . '║');
        $this->command->info('║  Campañas      : ' . str_pad(Campaign::count() . ' campañas totales', 42) . '║');
        $this->command->info('║  Publicaciones : ' . str_pad(Publication::count() . ' publicaciones totales', 42) . '║');
        $this->command->info('║  Analytics     : ' . str_pad(CampaignAnalytics::count() . ' registros totales', 42) . '║');
        $this->command->info('╚══════════════════════════════════════════════════════════╝');
        $this->command->info('');
        
        $this->command->line('💡 Usuarios de prueba:');
        foreach ($testUsers as $user) {
            $this->command->line("   • {$user['email']} / password: " . self::TEST_PASSWORD);
        }
        $this->command->info('');
    }

    // ──────────────────────────────────────────────────────────────────
    // Redes sociales con metadata simulada realista
    // ──────────────────────────────────────────────────────────────────
    private function seedSocialAccounts(User $user, ?int $workspaceId): void
    {
        $platforms = [
            'facebook' => [
                'account_id'   => 'fb_' . $user->id . '_demo',
                'account_name' => 'Dev Facebook Page',
                'metadata'     => [
                    'username'   => 'devfacebookpage',
                    'avatar'     => 'https://i.pravatar.cc/150?img=1',
                    'followers'  => 4820,
                    'page_id'    => '123456789',
                    'page_name'  => 'Dev Facebook Page',
                ],
            ],
            'instagram' => [
                'account_id'   => 'ig_' . $user->id . '_demo',
                'account_name' => '@dev_instagram',
                'metadata'     => [
                    'username'   => 'dev_instagram',
                    'avatar'     => 'https://i.pravatar.cc/150?img=2',
                    'followers'  => 12340,
                    'bio'        => 'Cuenta de prueba para desarrollo 🚀',
                ],
            ],
            'twitter' => [
                'account_id'   => 'tw_' . $user->id . '_demo',
                'account_name' => '@dev_twitter',
                'metadata'     => [
                    'username'       => 'dev_twitter',
                    'avatar'         => 'https://i.pravatar.cc/150?img=3',
                    'followers'      => 3210,
                    'oauth1_token'   => Str::random(40),
                    'secret'         => Str::random(40),
                ],
            ],
            'tiktok' => [
                'account_id'   => 'tt_' . $user->id . '_demo',
                'account_name' => '@dev_tiktok',
                'metadata'     => [
                    'username'   => 'dev_tiktok',
                    'avatar'     => 'https://i.pravatar.cc/150?img=4',
                    'followers'  => 8900,
                ],
            ],
            'youtube' => [
                'account_id'   => 'yt_' . $user->id . '_demo',
                'account_name' => 'Dev YouTube Channel',
                'metadata'     => [
                    'username'    => 'DevYouTubeChannel',
                    'avatar'      => 'https://i.pravatar.cc/150?img=5',
                    'subscribers' => 2150,
                    'channel_id'  => 'UCdev_' . $user->id,
                ],
            ],
        ];

        $created  = 0;
        $existing = 0;

        foreach ($platforms as $platform => $data) {
            $alreadyExists = SocialAccount::where('user_id', $user->id)
                ->where('platform', $platform)
                ->exists();

            if ($alreadyExists) {
                $existing++;
                continue;
            }

            SocialAccount::create([
                'user_id'          => $user->id,
                'workspace_id'     => $workspaceId,
                'platform'         => $platform,
                'account_id'       => $data['account_id'],
                'account_name'     => $data['account_name'],
                'access_token'     => Str::random(64),
                'refresh_token'    => Str::random(64),
                'token_expires_at' => Carbon::now()->addDays(60),
                'is_active'        => true,
                'failure_count'    => 0,
                'account_metadata' => $data['metadata'],
            ]);

            $created++;
        }

        $this->command->info("   ✅ {$created} cuentas creadas, {$existing} ya existían");
    }

    // ──────────────────────────────────────────────────────────────────
    // Campañas de ejemplo
    // ──────────────────────────────────────────────────────────────────
    private function seedCampaigns(User $user, ?int $workspaceId): void
    {
        $campaigns = [
            [
                'name'        => 'Lanzamiento de Producto Q2',
                'description' => 'Campaña de lanzamiento del nuevo producto para el segundo trimestre',
                'status'      => 'active',
                'goal'        => 'Aumentar brand awareness un 30%',
                'budget'      => 5000,
                'start_date'  => Carbon::now()->subDays(15)->format('Y-m-d'),
                'end_date'    => Carbon::now()->addDays(45)->format('Y-m-d'),
            ],
            [
                'name'        => 'Campaña de Verano',
                'description' => 'Promociones especiales para la temporada de verano',
                'status'      => 'active',
                'goal'        => 'Incrementar ventas en un 20%',
                'budget'      => 3000,
                'start_date'  => Carbon::now()->subDays(5)->format('Y-m-d'),
                'end_date'    => Carbon::now()->addDays(60)->format('Y-m-d'),
            ],
            [
                'name'        => 'Re-engagement de Clientes',
                'description' => 'Campaña para recuperar clientes inactivos',
                'status'      => 'inactive',
                'goal'        => 'Recuperar el 15% de clientes perdidos',
                'budget'      => 1500,
                'start_date'  => Carbon::now()->addDays(7)->format('Y-m-d'),
                'end_date'    => Carbon::now()->addDays(37)->format('Y-m-d'),
            ],
        ];

        $created  = 0;
        $existing = 0;

        foreach ($campaigns as $data) {
            $alreadyExists = Campaign::where('user_id', $user->id)
                ->where('name', $data['name'])
                ->exists();

            if ($alreadyExists) {
                $existing++;
                continue;
            }

            Campaign::create(array_merge($data, [
                'user_id'      => $user->id,
                'workspace_id' => $workspaceId,
            ]));

            $created++;
        }

        $this->command->info("   ✅ {$created} campañas creadas, {$existing} ya existían");
    }

    // ──────────────────────────────────────────────────────────────────
    // Métricas de redes sociales
    // ──────────────────────────────────────────────────────────────────
    private function seedSocialMetrics(User $user, ?int $workspaceId): void
    {
        $socialAccounts = SocialAccount::where('user_id', $user->id)->get();
        
        $totalMetrics = 0;

        foreach ($socialAccounts as $account) {
            $startDate = Carbon::now()->subDays(90);
            $currentDate = $startDate->copy();
            $followers = match($account->platform) {
                'facebook' => 4820,
                'instagram' => 12340,
                'twitter' => 3210,
                'tiktok' => 8900,
                'youtube' => 2150,
                default => 5000,
            };

            while ($currentDate <= Carbon::now()) {
                $exists = SocialMediaMetrics::where('social_account_id', $account->id)
                    ->where('date', $currentDate->format('Y-m-d'))
                    ->exists();

                if (!$exists) {
                    $isWeekend = $currentDate->isWeekend();
                    
                    $growthRate = match($account->platform) {
                        'tiktok' => rand(50, 300),
                        'youtube' => rand(10, 100),
                        'facebook' => rand(5, 50),
                        'twitter' => rand(-10, 80),
                        default => rand(0, 50),
                    };
                    
                    $dailyGrowth = $isWeekend ? (int)($growthRate * 0.7) : $growthRate;
                    $followers += $dailyGrowth;
                    if ($followers < 0) $followers = 0;

                    $postsPerDay = match($account->platform) {
                        'tiktok' => $isWeekend ? rand(2, 5) : rand(1, 3),
                        'twitter' => $isWeekend ? rand(3, 8) : rand(5, 15),
                        'facebook' => $isWeekend ? rand(1, 2) : rand(0, 2),
                        'youtube' => rand(0, 1),
                        default => rand(0, 2),
                    };

                    $engagementRate = match($account->platform) {
                        'tiktok' => rand(8, 18),
                        'youtube' => rand(4, 10),
                        'facebook' => rand(1, 4),
                        'twitter' => rand(1, 3),
                        default => rand(1, 5),
                    };

                    $views = (int)($followers * ($postsPerDay + 1) * (rand(10, 30) / 100));
                    $totalLikes = (int)($views * ($engagementRate / 100));
                    $totalComments = (int)($totalLikes * (rand(5, 15) / 100));
                    $totalShares = (int)($totalLikes * (rand(2, 8) / 100));

                    SocialMediaMetrics::create([
                        'social_account_id' => $account->id,
                        'user_id' => $user->id,
                        'date' => $currentDate->format('Y-m-d'),
                        'followers' => $followers,
                        'following' => rand(100, 1000),
                        'posts_count' => $postsPerDay,
                        'total_likes' => $totalLikes,
                        'total_comments' => $totalComments,
                        'total_shares' => $totalShares,
                        'engagement_rate' => $engagementRate,
                    ]);

                    $totalMetrics++;
                }

                $currentDate->addDay();
            }
        }

        $this->command->info("   ✅ {$totalMetrics} registros de métricas creados");
    }

    // ──────────────────────────────────────────────────────────────────
    // Publicaciones de ejemplo con analytics
    // ──────────────────────────────────────────────────────────────────
    private function seedPublications(User $user, ?int $workspaceId): void
    {
        $publicationTemplates = [
            [
                'title' => 'Rebajas de Verano 2026 - Hasta 50% de Descuento',
                'body' => "🌞 ¡El verano está aquí y nuestras ofertas también! 🔥\n\nDisfruta de descuentos increíbles en toda nuestra colección de verano. Desde ropa de playa hasta accesorios frescos, tenemos todo lo que necesitas para brillar esta temporada.\n\n✨ Ofertas destacadas:\n• Trajes de baño: 40% OFF\n• Gafas de sol: 30% OFF\n• Sandalias: 50% OFF\n• Vestidos de verano: 35% OFF",
                'hashtags' => ['#verano2026', '#rebajas'],
                'goal' => 'Incrementar ventas de verano en un 35%',
                'url' => 'https://tienda.example.com/verano-2026',
            ],
            [
                'title' => 'Lanzamiento Colección Invierno - Nuevos Diseños',
                'body' => "❄️ Nueva Colección de Invierno Ya Disponible ❄️\n\nDescubre las últimas tendencias en moda invernal. Diseños exclusivos que combinan estilo y comodidad para mantenerte abrigado con clase.",
                'hashtags' => ['#invierno', '#moda', '#nuevaColeccion'],
                'goal' => 'Lanzamiento exitoso con 500+ ventas',
                'url' => 'https://tienda.example.com/invierno-coleccion',
            ],
            [
                'title' => 'Promo Gadgets Tech - Vida Inteligente',
                'body' => "🚀 Tecnología que Transforma tu Vida 📱\n\n¿Listo para actualizar tu setup? Tenemos los gadgets más innovadores del mercado con precios especiales.",
                'hashtags' => ['#tecnologia', '#gadgets', '#tech'],
                'goal' => 'Posicionar marca en segmento tech',
                'url' => 'https://tech.example.com/promo-gadgets',
            ],
            [
                'title' => 'Campaña Alimentación Orgánica - Vida Saludable',
                'body' => "🌱 Alimentación Consciente, Vida Saludable 🥗\n\nÚnete al movimiento de comida orgánica y descubre cómo pequeños cambios en tu dieta pueden transformar tu bienestar.",
                'hashtags' => ['#organico', '#comidaSana', '#wellness'],
                'goal' => 'Educar audiencia sobre alimentación orgánica',
                'url' => 'https://organic.example.com/productos',
            ],
            [
                'title' => 'Desafío Fitness 30 Días - Transformación Total',
                'body' => "💪 Desafío Fitness de 30 Días - ¡Transforma Tu Cuerpo y Mente! 🏋️\n\n¿Estás listo para el cambio definitivo? Únete a nuestro desafío de transformación integral.",
                'hashtags' => ['#fitness', '#workout', '#desafio', '#transformacion'],
                'goal' => 'Conseguir 200 participantes en el desafío',
                'url' => 'https://fitness.example.com/desafio-30-dias',
            ],
            [
                'title' => 'Black Friday Mega Ofertas - Tiempo Limitado',
                'body' => "🖤 BLACK FRIDAY ESTÁ AQUÍ 🛍️\n\n¡Las ofertas más esperadas del año han llegado! Descuentos de hasta 70% en productos seleccionados.",
                'hashtags' => ['#blackFriday', '#ofertas', '#descuentos'],
                'goal' => 'Maximizar ventas - objetivo $50,000 en 48 horas',
                'url' => 'https://shop.example.com/black-friday-2026',
            ],
            [
                'title' => 'Propósitos Año Nuevo 2026 - Nuevo Comienzo',
                'body' => "🎆 Nuevo Año, Nueva Tú ✨\n\n2026 es tu año para brillar y cumplir todos tus sueños. Te ayudamos a cumplir tus propósitos.",
                'hashtags' => ['#anoNuevo', '#propositos', '#metas'],
                'goal' => 'Engagement alto - 10,000 interacciones en enero',
                'url' => 'https://programas.example.com/ano-nuevo-2026',
            ],
            [
                'title' => 'Moda Sostenible - Estilo con Conciencia Ecológica',
                'body' => "🌿 Moda Sostenible: Estilo con Conciencia 👗\n\nLa moda puede ser hermosa Y responsable con el planeta. Descubre nuestra línea eco-friendly.",
                'hashtags' => ['#modaSostenible', '#ecoFriendly'],
                'goal' => 'Posicionar marca como líder en moda sostenible',
                'url' => 'https://eco.example.com/moda-sostenible',
            ],
            [
                'title' => 'Webinar Gratuito - Marketing Digital 2026',
                'body' => "🎓 Webinar GRATUITO: Estrategias de Marketing Digital para 2026 📊\n\n¿Quieres llevar tu negocio al siguiente nivel? Únete a nuestro webinar exclusivo.",
                'hashtags' => ['#webinar', '#marketingDigital'],
                'goal' => 'Generar 500+ registros',
                'url' => 'https://eventos.example.com/webinar-marketing-2026',
            ],
            [
                'title' => 'Lanzamiento App Móvil - Productividad Máxima',
                'body' => "📱 ¡Lanzamos nuestra APP! Tu asistente de productividad personal 🚀\n\nDespués de 2 años de desarrollo, finalmente está aquí.",
                'hashtags' => ['#appMovil', '#productividad', '#tecnologia'],
                'goal' => 'Alcanzar 10,000 descargas en primer mes',
                'url' => 'https://app.example.com/descargar',
            ],
            [
                'title' => 'Curso Online - Fotografía Profesional desde Cero',
                'body' => "📸 Curso Online: Fotografía Profesional desde Cero 🎨\n\n¿Siempre quisiste ser fotógrafo profesional? Este es tu momento.",
                'hashtags' => ['#fotografia', '#cursoOnline'],
                'goal' => 'Vender 100 cursos en lanzamiento',
                'url' => 'https://cursos.example.com/fotografia-profesional',
            ],
            [
                'title' => 'Concurso Redes Sociales - Gana Viaje a París',
                'body' => "🎉 ¡MEGA CONCURSO! Gana un Viaje para 2 a París ✈️🗼\n\nCelebramos 10 años y queremos premiarte con el viaje de tus sueños.",
                'hashtags' => ['#concurso', '#sorteo', '#ganaViaje'],
                'goal' => 'Viralizar marca alcanzando 50,000+ interacciones',
                'url' => 'https://concurso.example.com/viaje-paris',
            ],
            [
                'title' => 'Podcast Semanal - Historias de Éxito Empresarial',
                'body' => "🎙️ NUEVO EPISODIO de nuestro Podcast 🚀\n\nEntrevistamos a María López, CEO de TechStart, quien nos cuenta cómo pasó de $0 a $10M.",
                'hashtags' => ['#podcast', '#emprendimiento', '#negocio'],
                'goal' => 'Alcanzar 5,000 reproducciones',
                'url' => 'https://podcast.example.com/episodio-15',
            ],
            [
                'title' => 'Masterclass Gratuita - Inversiones Inteligentes',
                'body' => "💰 Masterclass GRATUITA: Inversiones Inteligentes para Principiantes 📈\n\n¿Quieres hacer crecer tu dinero? Esta masterclass es para ti.",
                'hashtags' => ['#inversiones', '#finanzas', '#masterclass'],
                'goal' => 'Generar 500 registros',
                'url' => 'https://masterclass.example.com/inversiones',
            ],
            [
                'title' => 'Lanzamiento Libro - Guía Completa de Redes Sociales',
                'body' => "📚 ¡MI LIBRO YA ESTÁ DISPONIBLE! 🎉\n\nDespués de 2 años de trabajo, finalmente puedo compartir contigo todo lo que sé.",
                'hashtags' => ['#libro', '#redesSociales', '#marketing'],
                'goal' => 'Vender 1,000 copias en primer mes',
                'url' => 'https://libro.example.com/redes-sociales',
            ],
        ];

        $count = count($publicationTemplates);
        $created = 0;

        foreach ($publicationTemplates as $template) {
            $title = $template['title'] . ' - ' . Str::random(4);
            $startDate = Carbon::now()->subDays(rand(10, 90));
            $endDate = $startDate->copy()->addDays(rand(7, 60));

            $statusOptions = ['published', 'published', 'published', 'scheduled', 'draft'];
            $status = $statusOptions[array_rand($statusOptions)];

            $platformSettings = [
                'facebook' => [
                    'enabled' => rand(0, 1) === 1,
                    'post_type' => ['status', 'photo', 'link'][rand(0, 2)],
                ],
                'twitter' => [
                    'enabled' => rand(0, 1) === 1,
                    'thread' => rand(0, 1) === 1,
                ],
            ];

            $publication = Publication::create([
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'title' => $title,
                'slug' => Str::slug($title),
                'status' => $status,
                'goal' => $template['goal'],
                'body' => $template['body'],
                'description' => 'Publicación de prueba con contenido detallado y hashtags relevantes.',
                'hashtags' => $template['hashtags'],
                'url' => $template['url'],
                'platform_settings' => $platformSettings,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'publish_date' => $startDate,
                'published_at' => $status === 'published' ? $startDate : null,
                'published_by' => $status === 'published' ? $user->id : null,
                'approved_at' => in_array($status, ['published', 'scheduled']) ? $startDate->copy()->subHours(2) : null,
                'approved_by' => in_array($status, ['published', 'scheduled']) ? $user->id : null,
            ]);

            // Generar analytics si está publicada
            if ($status === 'published') {
                $this->generatePublicationAnalytics($publication);
            }

            $created++;
        }

        $this->command->info("   ✅ {$created} publicaciones creadas con analytics");
    }

    // ──────────────────────────────────────────────────────────────────
    // Generar analytics para cada publicación
    // ──────────────────────────────────────────────────────────────────
    private function generatePublicationAnalytics(Publication $publication): void
    {
        $currentDate = $publication->start_date->copy();
        $endDate = $publication->end_date->copy()->min(Carbon::now());

        $baseViews = rand(100, 1000);

        while ($currentDate <= $endDate) {
            $isWeekend = $currentDate->isWeekend();
            $multiplier = $isWeekend ? 0.6 : 1.1;

            $views = (int)($baseViews * $multiplier * (rand(80, 120) / 100));
            $clicks = (int)($views * (rand(2, 10) / 100));
            $conversions = (int)($clicks * (rand(5, 20) / 100));
            $likes = (int)($views * (rand(5, 15) / 100));
            $comments = (int)($likes * (rand(5, 20) / 100));
            $shares = (int)($likes * (rand(2, 10) / 100));
            $saves = (int)($likes * (rand(1, 5) / 100));

            CampaignAnalytics::create([
                'publication_id' => $publication->id,
                'user_id' => $publication->user_id,
                'date' => $currentDate->format('Y-m-d'),
                'views' => $views,
                'clicks' => $clicks,
                'conversions' => $conversions,
                'likes' => $likes,
                'comments' => $comments,
                'shares' => $shares,
                'saves' => $saves,
                'reach' => (int)($views * (rand(80, 95) / 100)),
                'impressions' => (int)($views * (rand(110, 140) / 100)),
                'engagement_rate' => $views > 0 ? round((($likes + $comments + $shares + $saves) / $views) * 100, 2) : 0,
                'ctr' => $views > 0 ? round(($clicks / $views) * 100, 2) : 0,
                'conversion_rate' => $clicks > 0 ? round(($conversions / $clicks) * 100, 2) : 0,
            ]);

            $currentDate->addDay();
            $baseViews = $baseViews * (rand(95, 105) / 100);
        }
    }
}
