<?php

namespace Tests\Feature;

use App\Models\Social\SocialAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TokenEncryptionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that tokens are encrypted when stored in database.
     */
    public function test_tokens_are_encrypted_in_database(): void
    {
        $user = User::factory()->create();
        
        $plainAccessToken = 'test_access_token_12345';
        $plainRefreshToken = 'test_refresh_token_67890';
        
        // Create a social account with tokens
        $account = SocialAccount::create([
            'user_id' => $user->id,
            'platform' => 'facebook',
            'account_id' => 'test_account_123',
            'account_name' => 'Test Account',
            'access_token' => $plainAccessToken,
            'refresh_token' => $plainRefreshToken,
        ]);
        
        // Retrieve raw data from database
        $rawData = DB::table('social_accounts')
            ->where('id', $account->id)
            ->first();
        
        // Verify tokens are encrypted in database (not plain text)
        $this->assertNotEquals($plainAccessToken, $rawData->access_token);
        $this->assertNotEquals($plainRefreshToken, $rawData->refresh_token);
        
        // Verify tokens are decrypted when accessed through model
        $this->assertEquals($plainAccessToken, $account->access_token);
        $this->assertEquals($plainRefreshToken, $account->refresh_token);
    }

    /**
     * Test that tokens can be updated and remain encrypted.
     */
    public function test_tokens_remain_encrypted_after_update(): void
    {
        $user = User::factory()->create();
        
        $account = SocialAccount::create([
            'user_id' => $user->id,
            'platform' => 'instagram',
            'account_id' => 'test_account_456',
            'account_name' => 'Test Instagram',
            'access_token' => 'old_token',
            'refresh_token' => 'old_refresh',
        ]);
        
        $newAccessToken = 'new_access_token_xyz';
        $newRefreshToken = 'new_refresh_token_abc';
        
        // Update tokens
        $account->update([
            'access_token' => $newAccessToken,
            'refresh_token' => $newRefreshToken,
        ]);
        
        // Retrieve raw data from database
        $rawData = DB::table('social_accounts')
            ->where('id', $account->id)
            ->first();
        
        // Verify new tokens are encrypted
        $this->assertNotEquals($newAccessToken, $rawData->access_token);
        $this->assertNotEquals($newRefreshToken, $rawData->refresh_token);
        
        // Verify tokens are correctly decrypted
        $account->refresh();
        $this->assertEquals($newAccessToken, $account->access_token);
        $this->assertEquals($newRefreshToken, $account->refresh_token);
    }

    /**
     * Test that null tokens are handled correctly.
     */
    public function test_null_tokens_are_handled_correctly(): void
    {
        $user = User::factory()->create();
        
        $account = SocialAccount::create([
            'user_id' => $user->id,
            'platform' => 'twitter',
            'account_id' => 'test_account_789',
            'account_name' => 'Test Twitter',
            'access_token' => 'some_token',
            'refresh_token' => null,
        ]);
        
        $this->assertNotNull($account->access_token);
        $this->assertNull($account->refresh_token);
    }
}
