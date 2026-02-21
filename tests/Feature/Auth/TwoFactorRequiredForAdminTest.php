<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TwoFactorRequiredForAdminTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admin_without_2fa_is_redirected_to_setup()
    {
        $admin = User::factory()->create([
            'is_super_admin' => true,
            'two_factor_secret' => null,
        ]);

        $response = $this->actingAs($admin)
            ->get(route('admin.notifications.index'));

        $response->assertRedirect(route('2fa.setup'));
        $response->assertSessionHas('error', '2FA is required for admin accounts');
    }

    /** @test */
    public function admin_with_2fa_but_not_verified_is_redirected_to_verify()
    {
        $admin = User::factory()->create([
            'is_super_admin' => true,
            'two_factor_secret' => encrypt('test_secret'),
        ]);

        $response = $this->actingAs($admin)
            ->get(route('admin.notifications.index'));

        $response->assertRedirect(route('2fa.verify'));
    }

    /** @test */
    public function admin_with_verified_2fa_can_access_admin_routes()
    {
        $admin = User::factory()->create([
            'is_super_admin' => true,
            'two_factor_secret' => encrypt('test_secret'),
        ]);

        session(['2fa_verified_' . $admin->id => true]);

        $response = $this->actingAs($admin)
            ->get(route('admin.notifications.index'));

        $response->assertOk();
    }

    /** @test */
    public function non_admin_can_access_without_2fa()
    {
        $user = User::factory()->create([
            'is_super_admin' => false,
            'two_factor_secret' => null,
        ]);

        $response = $this->actingAs($user)
            ->get(route('dashboard'));

        $response->assertOk();
    }

    /** @test */
    public function admin_can_disable_2fa_with_valid_password()
    {
        $admin = User::factory()->create([
            'is_super_admin' => true,
            'password' => bcrypt('password123'),
            'two_factor_secret' => encrypt('test_secret'),
            'two_factor_backup_codes' => encrypt(json_encode(['CODE1', 'CODE2'])),
        ]);

        $response = $this->actingAs($admin)
            ->post(route('2fa.disable'), [
                'password' => 'password123',
            ]);

        $response->assertRedirect(route('profile.edit'));
        $response->assertSessionHas('success', '2FA has been disabled');

        $admin->refresh();
        $this->assertNull($admin->two_factor_secret);
        $this->assertNull($admin->two_factor_backup_codes);
    }

    /** @test */
    public function admin_cannot_disable_2fa_with_invalid_password()
    {
        $admin = User::factory()->create([
            'is_super_admin' => true,
            'password' => bcrypt('password123'),
            'two_factor_secret' => encrypt('test_secret'),
        ]);

        $response = $this->actingAs($admin)
            ->post(route('2fa.disable'), [
                'password' => 'wrong_password',
            ]);

        $response->assertSessionHasErrors(['password']);

        $admin->refresh();
        $this->assertNotNull($admin->two_factor_secret);
    }
}
