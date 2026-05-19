<?php

namespace Database\Seeders;

use App\Models\Campaigns\Campaign;
use App\Models\Permission\Permission;
use App\Models\Role\Role;
use App\Models\Social\SocialAccount;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * DevSeeder — Un solo comando para levantar el entorno de desarrollo con:
 *   - Roles y permisos
 *   - Configuración de suscripciones
 *   - 1 usuario de prueba con workspace propio (rol Owner)
 *   - Cuentas de redes sociales simuladas (facebook, instagram, twitter, tiktok, youtube)
 *   - Campañas de ejemplo
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

        // ── 3. Usuario de prueba ───────────────────────────────────────
        $this->command->info('▶  Usuario de prueba...');
        $user = User::firstOrCreate(
            ['email' => self::TEST_EMAIL],
            [
                'name'              => self::TEST_NAME,
                'password'          => Hash::make(self::TEST_PASSWORD),
                'email_verified_at' => now(),
            ]
        );

        if ($user->wasRecentlyCreated) {
            $this->command->info("   ✅ Usuario creado: " . self::TEST_EMAIL);
        } else {
            $this->command->info("   ℹ️  Usuario ya existe: " . self::TEST_EMAIL);
        }

        // ── 4. Workspace personal del usuario ─────────────────────────
        $this->command->info('▶  Workspace...');
        $ownerRole = Role::where('slug', 'owner')->first();

        if (!$ownerRole) {
            $this->command->error('   ❌ Rol "owner" no encontrado. Verifica que RolesAndPermissionsSeeder corrió bien.');
            return;
        }

        $workspace = null;

        if (!$user->workspaces()->exists()) {
            $workspace = Workspace::create([
                'name'       => self::TEST_NAME . "'s Workspace",
                'slug'       => Str::slug(self::TEST_NAME . '-workspace-' . Str::random(4)),
                'created_by' => $user->id,
            ]);

            $user->workspaces()->attach($workspace->id, ['role_id' => $ownerRole->id]);
            $user->update(['current_workspace_id' => $workspace->id]);

            $this->command->info("   ✅ Workspace creado: {$workspace->name} (ID: {$workspace->id})");
        } else {
            $workspace = $user->workspaces()->first();

            if (!$user->current_workspace_id) {
                $user->update(['current_workspace_id' => $workspace->id]);
            }

            $this->command->info("   ℹ️  Workspace ya existe (ID: {$workspace->id})");
        }

        // Usar el workspace activo del usuario para asociar todos los datos
        $workspaceId = $user->fresh()->current_workspace_id ?? $workspace?->id;

        // ── 5. Redes sociales simuladas ────────────────────────────────
        $this->command->info('▶  Cuentas de redes sociales...');
        $this->seedSocialAccounts($user, $workspaceId);

        // ── 6. Campañas de ejemplo ─────────────────────────────────────
        $this->command->info('▶  Campañas de ejemplo...');
        $this->seedCampaigns($user, $workspaceId);

        // ── Resumen ────────────────────────────────────────────────────
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════╗');
        $this->command->info('║              ✅ DevSeeder completado                     ║');
        $this->command->info('╠══════════════════════════════════════════════════════════╣');
        $this->command->info('║  Email         : ' . str_pad(self::TEST_EMAIL, 42) . '║');
        $this->command->info('║  Password      : ' . str_pad(self::TEST_PASSWORD, 42) . '║');
        $this->command->info('║  Roles         : ' . str_pad(Role::count() . ' roles, ' . Permission::count() . ' permisos', 42) . '║');
        $this->command->info('║  Social cuentas: ' . str_pad(SocialAccount::where('user_id', $user->id)->count() . ' cuentas conectadas', 42) . '║');
        $this->command->info('║  Campañas      : ' . str_pad(Campaign::where('user_id', $user->id)->count() . ' campañas', 42) . '║');
        $this->command->info('╚══════════════════════════════════════════════════════════╝');
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
}
