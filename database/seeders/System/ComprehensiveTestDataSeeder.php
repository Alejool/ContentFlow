<?php

namespace Database\Seeders\System;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Auth\Role;
use App\Models\Auth\Permission;
use App\Models\Publications\Publication;
use App\Models\Campaigns\Campaign;
use App\Models\Campaigns\CampaignAnalytics;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialPostLog;
use App\Models\Approval\ApprovalWorkflow;
use App\Models\Approval\ApprovalLevel;
use App\Models\Approval\ApprovalRequest;
use App\Models\User\UserCalendarEvent;

class ComprehensiveTestDataSeeder extends Seeder
{
    // ── Colour palette for calendar events ───────────────────────────────────
    private array $eventColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
    ];

    public function run(): void
    {
        $this->command->info('▶  ComprehensiveTestDataSeeder starting…');

        // ── 1. Roles & permissions ────────────────────────────────────────────
        $this->ensureRolesAndPermissions();

        $ownerRole  = Role::where('slug', 'owner')->first();
        $adminRole  = Role::where('slug', 'admin')->first();
        $editorRole = Role::where('slug', 'editor')->first();
        $viewerRole = Role::where('slug', 'viewer')->first();

        // ── 2. Users ──────────────────────────────────────────────────────────
        $owner      = $this->upsertUser('owner@test.com',      'Laura Pérez',       'America/Bogota');
        $admin      = $this->upsertUser('admin@test.com',      'Carlos Rodríguez',  'America/Mexico_City');
        $editor     = $this->upsertUser('editor@test.com',     'Ana Martínez',      'Europe/Madrid');
        $viewer     = $this->upsertUser('viewer@test.com',     'David López',       'America/Lima');
        $freelancer = $this->upsertUser('freelancer@test.com', 'Sofia Torres',      'America/Santiago');

        // ── 3. Workspaces ─────────────────────────────────────────────────────
        $agency = $this->upsertWorkspace(
            'Agencia Creativa Digital',
            'agencia-creativa-digital',
            $owner
        );

        $solo = $this->upsertWorkspace(
            'Sofia Freelance Studio',
            'sofia-freelance-studio',
            $freelancer
        );

        // Attach members to agency workspace
        $this->attachMember($agency, $owner,      $ownerRole);
        $this->attachMember($agency, $admin,      $adminRole);
        $this->attachMember($agency, $editor,     $editorRole);
        $this->attachMember($agency, $viewer,     $viewerRole);
        $this->attachMember($solo,   $freelancer, $ownerRole);

        // Set current workspace
        $owner->update(['current_workspace_id'      => $agency->id]);
        $admin->update(['current_workspace_id'       => $agency->id]);
        $editor->update(['current_workspace_id'      => $agency->id]);
        $viewer->update(['current_workspace_id'      => $agency->id]);
        $freelancer->update(['current_workspace_id'  => $solo->id]);

        // ── 4. Social accounts ────────────────────────────────────────────────
        $accounts = $this->createSocialAccounts($owner, $agency);
        $soloAccounts = $this->createSocialAccounts($freelancer, $solo, ['facebook', 'twitter']);

        // ── 5. Approval workflows ─────────────────────────────────────────────
        [$simpleWf, $multiWf] = $this->createApprovalWorkflows($agency, $editorRole, $adminRole);

        // ── 6. Publications ───────────────────────────────────────────────────

        // 6a. Standalone publications (no campaign) — all statuses & types
        $standalone = $this->createStandalonePublications($owner, $admin, $editor, $agency, $simpleWf);

        // 6b. Campaigns with linked publications
        $this->createCampaignWithPublications(
            'Campaña Navidad 2025',
            'active',
            $owner, $agency, $multiWf,
            $accounts,
            [
                ['title' => 'Feliz Navidad - Post Especial',       'type' => 'post',     'status' => 'published'],
                ['title' => 'Reels Nochebuena - Descuentos 50%',   'type' => 'reel',     'status' => 'published'],
                ['title' => 'Stories Navideñas - Gift Guide',      'type' => 'story',    'status' => 'approved'],
                ['title' => 'Encuesta Regalos - ¿Qué prefieres?',  'type' => 'poll',     'status' => 'scheduled'],
                ['title' => 'Carousel Colección Especial',         'type' => 'carousel', 'status' => 'pending_review'],
            ]
        );

        $this->createCampaignWithPublications(
            'Lanzamiento Producto Q1 2026',
            'active',
            $admin, $agency, $multiWf,
            $accounts,
            [
                ['title' => 'Teaser: Algo grande viene',           'type' => 'reel',  'status' => 'published'],
                ['title' => 'Lanzamiento Oficial - La espera terminó', 'type' => 'post', 'status' => 'published'],
                ['title' => 'Review Primeras Impresiones',         'type' => 'post',  'status' => 'rejected'],
                ['title' => 'Tutorial de Uso - Primeros pasos',    'type' => 'reel',  'status' => 'pending_review'],
                ['title' => 'FAQ - Preguntas frecuentes',          'type' => 'post',  'status' => 'draft'],
            ]
        );

        $this->createCampaignWithPublications(
            'Black Friday 2025',
            'completed',
            $owner, $agency, $simpleWf,
            $accounts,
            [
                ['title' => 'Black Friday - Countdown 3 días',     'type' => 'post',  'status' => 'published'],
                ['title' => 'Black Friday - Countdown 1 día',      'type' => 'story', 'status' => 'published'],
                ['title' => 'Black Friday - ¡Ya comenzó! 70% OFF', 'type' => 'post',  'status' => 'published'],
                ['title' => 'Black Friday - Últimas horas',        'type' => 'reel',  'status' => 'published'],
            ]
        );

        $this->createCampaignWithPublications(
            'Contenido Redes Enero',
            'active',
            $editor, $agency, $simpleWf,
            $accounts,
            [
                ['title' => 'Tips Productividad Semana 1',         'type' => 'post',  'status' => 'draft'],
                ['title' => 'Motivación Lunes - ¡Nueva semana!',   'type' => 'reel',  'status' => 'draft'],
                ['title' => 'Behind the Scenes - Nuestro equipo',  'type' => 'post',  'status' => 'pending_review'],
            ]
        );

        // Solo freelancer campaign
        $this->createCampaignWithPublications(
            'Portfolio Personal Q1',
            'active',
            $freelancer, $solo, null,
            $soloAccounts,
            [
                ['title' => 'Proyecto Diseño Web - Case Study',    'type' => 'carousel', 'status' => 'published'],
                ['title' => 'Testimonial Cliente Satisfecho',      'type' => 'post',     'status' => 'published'],
                ['title' => 'Servicios que ofrezco en 2026',       'type' => 'reel',     'status' => 'scheduled'],
            ]
        );

        // ── 7. Calendar events ────────────────────────────────────────────────
        $this->createCalendarEvents($owner,      $agency);
        $this->createCalendarEvents($admin,      $agency);
        $this->createCalendarEvents($editor,     $agency);
        $this->createCalendarEvents($freelancer, $solo, 8);

        $this->command->info('✅  ComprehensiveTestDataSeeder done.');
        $this->command->line('');
        $this->command->line('  Credentials (password: <fg=yellow>password</>)');
        $this->command->line('  owner@test.com      → Owner   (Agencia Creativa Digital)');
        $this->command->line('  admin@test.com      → Admin   (Agencia Creativa Digital)');
        $this->command->line('  editor@test.com     → Editor  (Agencia Creativa Digital)');
        $this->command->line('  viewer@test.com     → Viewer  (Agencia Creativa Digital)');
        $this->command->line('  freelancer@test.com → Owner   (Sofia Freelance Studio)');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function ensureRolesAndPermissions(): void
    {
        $perms = [
            ['name' => 'Publish',          'slug' => 'publish'],
            ['name' => 'Approve',           'slug' => 'approve'],
            ['name' => 'View Analytics',    'slug' => 'view-analytics'],
            ['name' => 'Manage Accounts',   'slug' => 'manage-accounts'],
            ['name' => 'Manage Team',       'slug' => 'manage-team'],
            ['name' => 'Manage Content',    'slug' => 'manage-content'],
            ['name' => 'Manage Campaigns',  'slug' => 'manage-campaigns'],
        ];
        foreach ($perms as $p) {
            Permission::firstOrCreate(['slug' => $p['slug']], array_merge($p, ['description' => $p['name']]));
        }

        $roles = [
            'owner'  => ['publish', 'approve', 'view-analytics', 'manage-accounts', 'manage-team', 'manage-content', 'manage-campaigns'],
            'admin'  => ['publish', 'approve', 'view-analytics', 'manage-accounts', 'manage-content', 'manage-campaigns'],
            'editor' => ['view-analytics', 'manage-content', 'manage-campaigns'],
            'viewer' => ['view-analytics'],
        ];
        foreach ($roles as $slug => $permSlugs) {
            $role = Role::firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug), 'description' => ucfirst($slug) . ' role']);
            $role->permissions()->sync(Permission::whereIn('slug', $permSlugs)->pluck('id'));
        }
    }

    private function upsertUser(string $email, string $name, string $timezone): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            [
                'name'              => $name,
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
                'timezone'          => $timezone,
                'locale'            => 'es',
            ]
        );
    }

    private function upsertWorkspace(string $name, string $slug, User $owner): Workspace
    {
        return Workspace::firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'created_by' => $owner->id, 'description' => "Workspace de prueba: $name"]
        );
    }

    private function attachMember(Workspace $ws, User $user, Role $role): void
    {
        if (!$ws->users()->where('user_id', $user->id)->exists()) {
            $ws->users()->attach($user->id, ['role_id' => $role->id]);
        }
    }

    private function createSocialAccounts(User $owner, Workspace $ws, array $platforms = []): array
    {
        $allPlatforms = [
            'facebook' => ['name' => 'Facebook Business',      'followers' => rand(8000,  50000)],
            'twitter'  => ['name' => 'X / Twitter',            'followers' => rand(3000,  25000)],
            'tiktok'   => ['name' => 'TikTok Creator',         'followers' => rand(20000, 200000)],
            'youtube'  => ['name' => 'YouTube Channel',        'followers' => rand(5000,  80000)],
        ];

        $selected = empty($platforms) ? array_keys($allPlatforms) : $platforms;
        $result   = [];

        foreach ($selected as $platform) {
            $cfg     = $allPlatforms[$platform];
            $account = SocialAccount::withoutGlobalScopes()->firstOrCreate(
                ['user_id' => $owner->id, 'workspace_id' => $ws->id, 'platform' => $platform],
                [
                    'account_id'        => 'test_' . $platform . '_' . $owner->id . '_' . rand(1000, 9999),
                    'account_name'      => $cfg['name'] . ' – ' . $owner->name,
                    'access_token'      => 'dummy_access_' . Str::random(32),
                    'refresh_token'     => 'dummy_refresh_' . Str::random(32),
                    'token_expires_at'  => now()->addDays(60),
                    'is_active'         => true,
                    'account_metadata'  => ['followers' => $cfg['followers'], 'verified' => true],
                ]
            );
            $result[$platform] = $account;
        }

        return $result;
    }

    private function createApprovalWorkflows(Workspace $ws, Role $editorRole, Role $adminRole): array
    {
        // One workflow per workspace (unique constraint) — multi-level Editor → Admin.
        // The same workflow is reused for both "simple" and "multi" scenarios in this seeder.
        $wf = ApprovalWorkflow::firstOrCreate(
            ['workspace_id' => $ws->id],
            [
                'name'           => 'Flujo Aprobación (Editor → Admin)',
                'is_active'      => true,
                'is_enabled'     => true,
                'is_multi_level' => true,
            ]
        );

        ApprovalLevel::firstOrCreate(
            ['approval_workflow_id' => $wf->id, 'level_number' => 1],
            ['level_name' => 'Revisión Editor', 'role_id' => $editorRole->id, 'require_all_users' => false]
        );
        ApprovalLevel::firstOrCreate(
            ['approval_workflow_id' => $wf->id, 'level_number' => 2],
            ['level_name' => 'Aprobación Final Admin', 'role_id' => $adminRole->id, 'require_all_users' => false]
        );

        // Return the same workflow twice so callers that expect [$simple, $multi] still work
        return [$wf, $wf];
    }

    private function createStandalonePublications(
        User $owner, User $admin, User $editor, Workspace $ws,
        ApprovalWorkflow $workflow
    ): array {
        $specs = [
            // [user, type, status, platform, daysAgo]
            [$owner,  'post',     'draft',          'facebook', 1],
            [$owner,  'reel',     'draft',          'tiktok',   2],
            [$editor, 'post',     'draft',          'twitter',  1],
            [$admin,  'post',     'pending_review', 'facebook', 3],
            [$editor, 'reel',     'pending_review', 'tiktok',   4],
            [$owner,  'carousel', 'approved',       'facebook', 5],
            [$owner,  'post',     'scheduled',      'twitter',  2],
            [$admin,  'story',    'scheduled',      'facebook', 1],
            [$owner,  'post',     'published',      'facebook', 10],
            [$admin,  'reel',     'published',      'tiktok',   7],
            [$editor, 'post',     'published',      'twitter',  5],
            [$owner,  'post',     'failed',         'youtube',  3],
            [$editor, 'post',     'rejected',       'facebook', 6],
        ];

        $created = [];
        foreach ($specs as [$user, $type, $status, $platform, $daysAgo]) {
            $pub = $this->makePublication($user, $ws, $type, $status, $platform, now()->subDays($daysAgo));
            $created[] = $pub;

            if (in_array($status, ['pending_review', 'approved', 'rejected'])) {
                $this->createApprovalRequest($pub, $workflow, $user, $status);
            }
        }

        return $created;
    }

    private function createCampaignWithPublications(
        string $name, string $campaignStatus,
        User $owner, Workspace $ws, ?ApprovalWorkflow $workflow,
        array $accounts,
        array $pubSpecs
    ): void {
        $campaign = Campaign::withoutGlobalScopes()->firstOrCreate(
            ['workspace_id' => $ws->id, 'name' => $name],
            [
                'user_id'     => $owner->id,
                'description' => "Campaña de prueba: $name",
                'status'      => $campaignStatus,
                'start_date'  => now()->subDays(30),
                'end_date'    => now()->addDays(30),
                'goal'        => "Alcanzar 50,000 impresiones y 500 conversiones con $name",
                'budget'      => rand(500, 5000) . '.00',
            ]
        );

        foreach ($pubSpecs as $order => $spec) {
            $platform = $spec['platform'] ?? array_key_first($accounts);
            $daysAgo  = $spec['daysAgo']  ?? rand(1, 15);
            $pub      = $this->makePublication($owner, $ws, $spec['type'], $spec['status'], $platform, now()->subDays($daysAgo), $spec['title']);

            $campaign->publications()->syncWithoutDetaching([$pub->id => ['order' => $order]]);

            if ($workflow && in_array($spec['status'], ['pending_review', 'approved', 'rejected'])) {
                $this->createApprovalRequest($pub, $workflow, $owner, $spec['status']);
            }

            if ($spec['status'] === 'published') {
                $this->createPostLog($pub, $accounts, $platform);
                $this->createAnalytics($pub);
            }
        }
    }

    private function makePublication(
        User $user, Workspace $ws,
        string $type, string $status, string $platform,
        Carbon $createdAt, ?string $title = null
    ): Publication {
        $titles = [
            'post'     => ['Post Informativo sobre ' . ucfirst($platform), 'Contenido de Valor - Tips y Trucos', 'Historia de Éxito del Cliente'],
            'reel'     => ['Reel Viral - Tendencia 2026', 'Behind the Scenes - Nuestro proceso', 'Tutorial Rápido en 60 segundos'],
            'story'    => ['Story Interactiva - ¡Participa!', 'Countdown a nuestro evento', 'Encuesta rápida para seguidores'],
            'poll'     => ['Encuesta: ¿Cuál prefieres?', '¿Qué contenido quieres ver?', 'Vota por nuestra próxima colección'],
            'carousel' => ['Guía Completa en 5 pasos', 'Antes y Después - Resultados reales', 'Top 10 Recomendaciones'],
        ];

        $finalTitle = $title ?? $titles[$type][array_rand($titles[$type])];
        $slug       = Str::slug($finalTitle) . '-' . Str::random(6);

        $platformSettings = [
            $platform => [
                'enabled'  => true,
                'post_type' => match($type) {
                    'reel'     => 'reel',
                    'story'    => 'story',
                    'poll'     => 'poll',
                    'carousel' => 'carousel',
                    default    => 'post',
                },
                'target_audience' => ['18-35', '25-45', 'all'][rand(0, 2)],
            ],
        ];

        $pollOptions = $type === 'poll' ? ['Opción A', 'Opción B', 'Opción C', 'Opción D'] : null;

        $carouselItems = $type === 'carousel' ? [
            ['order' => 1, 'title' => 'Slide 1', 'description' => 'Primera diapositiva'],
            ['order' => 2, 'title' => 'Slide 2', 'description' => 'Segunda diapositiva'],
            ['order' => 3, 'title' => 'Slide 3', 'description' => 'Tercera diapositiva'],
        ] : null;

        $isScheduled  = $status === 'scheduled';
        $isPublished  = $status === 'published';
        $isApproved   = in_array($status, ['approved', 'scheduled', 'published']);
        $isRejected   = $status === 'rejected';

        $pub = Publication::withoutEvents(function () use (
            $user, $ws, $finalTitle, $slug, $type, $status, $platform,
            $platformSettings, $pollOptions, $carouselItems,
            $createdAt, $isScheduled, $isPublished, $isApproved, $isRejected
        ) {
            return Publication::withoutGlobalScopes()->create([
                'user_id'           => $user->id,
                'workspace_id'      => $ws->id,
                'title'             => $finalTitle,
                'slug'              => $slug,
                'status'            => $status,
                'content_type'      => $type,
                'body'              => $this->generateBody($type),
                'description'       => "Publicación de prueba tipo $type en estado $status.",
                'hashtags'          => $this->hashtags($type),
                'url'               => 'https://example.com/' . $slug,
                'platform_settings' => $platformSettings,
                'poll_options'      => $pollOptions,
                'carousel_items'    => $carouselItems,
                'goal'              => 'Alcanzar 10,000 impresiones y 500 clics.',
                'start_date'        => $createdAt->toDateString(),
                'end_date'          => $createdAt->copy()->addDays(30)->toDateString(),
                'scheduled_at'      => $isScheduled  ? now()->addDays(rand(1, 14)) : null,
                'published_at'      => $isPublished  ? $createdAt->copy()->addHours(rand(1, 5)) : null,
                'published_by'      => $isPublished  ? $user->id : null,
                'approved_at'       => $isApproved   ? $createdAt->copy()->addHour() : null,
                'approved_by'       => $isApproved   ? $user->id : null,
                'rejected_at'       => $isRejected   ? $createdAt->copy()->addHours(2) : null,
                'rejected_by'       => $isRejected   ? $user->id : null,
                'rejection_reason'  => $isRejected   ? 'El contenido no cumple con las guías de la marca. Requiere revisión del tono y la imagen.' : null,
                'created_at'        => $createdAt,
                'updated_at'        => $createdAt,
            ]);
        });

        return $pub;
    }

    private function createApprovalRequest(
        Publication $pub, ApprovalWorkflow $workflow,
        User $submittedBy, string $pubStatus
    ): void {
        if (ApprovalRequest::where('publication_id', $pub->id)->exists()) return;

        $arStatus = match($pubStatus) {
            'pending_review' => ApprovalRequest::STATUS_PENDING,
            'approved'       => ApprovalRequest::STATUS_APPROVED,
            'rejected'       => ApprovalRequest::STATUS_REJECTED,
            default          => ApprovalRequest::STATUS_PENDING,
        };

        ApprovalRequest::create([
            'publication_id'  => $pub->id,
            'workflow_id'     => $workflow->id,
            'current_step_id' => $workflow->levels()->first()?->id,
            'status'          => $arStatus,
            'submitted_by'    => $submittedBy->id,
            'submitted_at'    => $pub->created_at->copy()->addMinutes(10),
            'completed_at'    => $arStatus !== ApprovalRequest::STATUS_PENDING
                                    ? $pub->created_at->copy()->addHours(2)
                                    : null,
            'completed_by'    => $arStatus !== ApprovalRequest::STATUS_PENDING ? $submittedBy->id : null,
            'rejection_reason' => $arStatus === ApprovalRequest::STATUS_REJECTED
                                    ? 'El contenido no sigue las guías editoriales del workspace.'
                                    : null,
        ]);
    }

    private function createPostLog(Publication $pub, array $accounts, string $platform): void
    {
        $account = $accounts[$platform] ?? array_values($accounts)[0] ?? null;
        if (!$account) return;

        SocialPostLog::firstOrCreate(
            ['publication_id' => $pub->id, 'platform' => $platform],
            [
                'user_id'          => $pub->user_id,
                'workspace_id'     => $pub->workspace_id,
                'social_account_id' => $account->id,
                'platform'         => $platform,
                'account_name'     => $account->account_name,
                'platform_post_id' => 'post_' . Str::random(12),
                'post_url'         => 'https://' . $platform . '.com/p/' . Str::random(10),
                'post_type'        => $pub->content_type ?? 'post',
                'content'          => $pub->body ? substr($pub->body, 0, 280) : $pub->title,
                'status'           => 'published',
                'published_at'     => $pub->published_at ?? $pub->created_at,
                'engagement_data'  => [
                    'likes'    => rand(50, 5000),
                    'comments' => rand(5, 300),
                    'shares'   => rand(2, 200),
                    'reach'    => rand(500, 50000),
                    'impressions' => rand(1000, 100000),
                ],
            ]
        );
    }

    private function createAnalytics(Publication $pub): void
    {
        // Only create if no analytics exist
        if (CampaignAnalytics::where('publication_id', $pub->id)->exists()) return;

        $start = ($pub->published_at ?? $pub->created_at)->copy();
        $end   = $start->copy()->addDays(rand(5, 14))->min(now());
        $base  = rand(200, 2000);

        while ($start <= $end) {
            CampaignAnalytics::create([
                'publication_id'  => $pub->id,
                'user_id'         => $pub->user_id,
                'date'            => $start->toDateString(),
                'views'           => $v = (int)($base * (rand(80, 120) / 100)),
                'clicks'          => $c = (int)($v * rand(2, 8) / 100),
                'conversions'     => (int)($c * rand(5, 20) / 100),
                'likes'           => $l = (int)($v * rand(3, 10) / 100),
                'comments'        => (int)($l * rand(5, 15) / 100),
                'shares'          => (int)($l * rand(2, 8) / 100),
                'saves'           => (int)($l * rand(1, 5) / 100),
                'reach'           => (int)($v * rand(80, 95) / 100),
                'impressions'     => (int)($v * rand(110, 140) / 100),
                'engagement_rate' => round(rand(2, 12) + (rand(0, 99) / 100), 2),
                'ctr'             => round(rand(1, 6) + (rand(0, 99) / 100), 2),
                'conversion_rate' => round(rand(1, 15) + (rand(0, 99) / 100), 2),
            ]);
            $start->addDay();
            $base = (int)($base * (rand(90, 110) / 100));
        }
    }

    private function createCalendarEvents(User $user, Workspace $ws, int $count = 12): void
    {
        $eventTemplates = [
            // Meetings & team events
            ['Reunión de equipo semanal',          1, 'meeting',    true],
            ['Review de publicaciones pendientes', 1, 'review',     true],
            ['Sesión de brainstorming - Campaña',  2, 'creative',   true],
            ['Llamada con cliente - Presentación', 1, 'client',     false],
            ['Planning mensual de contenido',      3, 'planning',   true],
            ['Feedback sesión - Equipo creativo',  1, 'feedback',   false],
            // Deadlines & reminders
            ['Deadline entrega arte final',        0, 'deadline',   false],
            ['Publicación programada - Facebook',  0, 'publish',    true],
            ['Revisión métricas de la semana',     1, 'analytics',  true],
            ['Webinar: Tendencias RRSS 2026',      2, 'webinar',    true],
            // Personal / private
            ['Cita personal - No disponible',      0, 'personal',   false],
            ['Formación interna: Herramientas IA', 3, 'training',   false],
            ['Entrevista candidato Community Mgr', 1, 'interview',  false],
            ['Pitch deck - Nuevo cliente',         2, 'pitch',      false],
            ['Revisión contrato y presupuesto',    1, 'admin',      false],
        ];

        $base = now()->subDays(14);

        for ($i = 0; $i < $count; $i++) {
            $tmpl     = $eventTemplates[$i % count($eventTemplates)];
            $daysOff  = rand(-7, 30);
            $start    = $base->copy()->addDays($daysOff)->setHour(rand(8, 17))->setMinute(0);
            $duration = $tmpl[1]; // days

            UserCalendarEvent::withoutEvents(function () use ($user, $ws, $tmpl, $start, $duration, $i) {
                UserCalendarEvent::create([
                    'user_id'      => $user->id,
                    'workspace_id' => $ws->id,
                    'title'        => $tmpl[0],
                    'description'  => 'Evento de prueba: ' . $tmpl[1] . ' para probar el calendario.',
                    'start_date'   => $start,
                    'end_date'     => $duration > 0 ? $start->copy()->addDays($duration) : $start->copy()->addHour(),
                    'color'        => $this->eventColors[$i % count($this->eventColors)],
                    'is_public'    => $tmpl[3],
                    'remind_at'    => rand(0, 1) ? $start->copy()->subHour() : null,
                    'notification_sent' => false,
                ]);
            });
        }
    }

    // ── Content generators ────────────────────────────────────────────────────

    private function generateBody(string $type): string
    {
        return match($type) {
            'reel'     => "🎬 ¡Nuevo Reel disponible!\n\nDescubre en 60 segundos cómo transformar tu estrategia de contenido digital. Nuestro equipo comparte los secretos que usamos con nuestros mejores clientes.\n\n✨ Tips que verás:\n• Técnica #1 para aumentar engagement\n• El error más común que debes evitar\n• La fórmula que usamos para crecer x3\n\n¿Te gustó? Guárdalo para no olvidarlo. 🔖",
            'story'    => "📱 Story interactiva\n\n¿Cuál es tu mayor reto en redes sociales?\n\nA) Crear contenido constante\nB) Conseguir más seguidores\nC) Convertir seguidores en clientes\nD) Analizar los resultados\n\n¡Responde en nuestra encuesta!",
            'poll'     => "¿Qué tipo de contenido prefieres ver?\n\nVota y cuéntanos en los comentarios por qué. Usamos tu feedback para mejorar el contenido que creamos para ti cada semana.",
            'carousel' => "📌 GUARDA ESTE CAROUSEL\n\nTe compartimos nuestra metodología completa para crear contenido que convierte.\n\nDesliza para ver los 5 pasos →\n\nPaso 1: Define tu audiencia ideal\nPaso 2: Elige el formato correcto\nPaso 3: Crea el hook perfecto\nPaso 4: Añade valor real\nPaso 5: Incluye un CTA claro\n\n¿Cuál de estos pasos es el más difícil para ti?",
            default    => "💡 Contenido de valor para tu comunidad\n\nEl marketing digital evoluciona cada día. Hoy te traemos insights frescos basados en datos reales de nuestras campañas más exitosas del trimestre.\n\n🎯 Lo que aprendimos:\n• El contenido en video aumenta el alcance un 340%\n• Los posts con preguntas generan 3x más comentarios\n• Las historias de clientes convierten mejor que los testimonios tradicionales\n• Publicar entre 11am-1pm aumenta el engagement un 28%\n\n¿Cuál de estos datos te sorprende más? Cuéntanos en los comentarios 👇\n\n#MarketingDigital #ContenidoEstrategico #RedesSociales",
        };
    }

    private function hashtags(string $type): array
    {
        $base = ['#marketing', '#contenido', '#digitalmarketing', '#socialmedia', '#agencia'];
        $extra = match($type) {
            'reel'     => ['#reels', '#reelsviral', '#videomarketing'],
            'story'    => ['#stories', '#instagram', '#encuesta'],
            'poll'     => ['#encuesta', '#opinion', '#feedback'],
            'carousel' => ['#carousel', '#tips', '#guia', '#aprende'],
            default    => ['#post', '#contenido', '#tips'],
        };
        return array_merge($base, $extra);
    }
}
