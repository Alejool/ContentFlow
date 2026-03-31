<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use GuzzleHttp\Client;
use Abraham\TwitterOAuth\TwitterOAuth;

class TestTwitterConnection extends Command
{
    protected $signature = 'twitter:test';
    protected $description = 'Test Twitter API v1.1 and v2.0 connection';

    public function handle()
    {
        $this->info('Testing Twitter API Configuration...');
        $this->newLine();

        // Test v2.0 credentials
        $this->info('=== Testing OAuth 2.0 (v2.0) ===');
        $clientId = config('services.twitter.client_id');
        $clientSecret = config('services.twitter.client_secret');
        
        $this->line("Client ID: " . ($clientId ? substr($clientId, 0, 10) . '...' : 'NOT SET'));
        $this->line("Client Secret: " . ($clientSecret ? substr($clientSecret, 0, 10) . '...' : 'NOT SET'));
        
        if (!$clientId || !$clientSecret) {
            $this->error('❌ OAuth 2.0 credentials are missing!');
        } else {
            $this->info('✓ OAuth 2.0 credentials are configured');
        }
        
        $this->newLine();

        // Test v1.1 credentials
        $this->info('=== Testing OAuth 1.0a (v1.1) ===');
        $consumerKey = config('services.twitter.consumer_key');
        $consumerSecret = config('services.twitter.consumer_secret');
        
        $this->line("Consumer Key: " . ($consumerKey ? substr($consumerKey, 0, 10) . '...' : 'NOT SET'));
        $this->line("Consumer Secret: " . ($consumerSecret ? substr($consumerSecret, 0, 10) . '...' : 'NOT SET'));
        
        if (!$consumerKey || !$consumerSecret) {
            $this->error('❌ OAuth 1.0a credentials are missing!');
        } else {
            $this->info('✓ OAuth 1.0a credentials are configured');
        }

        $this->newLine();

        // Test if we can get a request token (v1.1)
        if ($consumerKey && $consumerSecret) {
            $this->info('=== Testing OAuth 1.0a Request Token ===');
            try {
                $connection = new TwitterOAuth($consumerKey, $consumerSecret);
                $requestToken = $connection->oauth('oauth/request_token', [
                    'oauth_callback' => url('/auth/twitter/callback-v1')
                ]);
                
                if (isset($requestToken['oauth_token'])) {
                    $this->info('✓ Successfully obtained OAuth 1.0a request token');
                } else {
                    $this->error('❌ Failed to get request token: ' . json_encode($requestToken));
                }
            } catch (\Throwable $e) {
                $this->error('❌ OAuth 1.0a test failed: ' . $e->getMessage());
            }
        }

        $this->newLine();
        $this->info('=== Configuration Summary ===');
        $this->line('For Twitter integration to work properly, you need:');
        $this->line('1. OAuth 2.0 credentials (TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET) - for v2.0 API');
        $this->line('2. OAuth 1.0a credentials (TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET) - for v1.1 API (media upload)');
        $this->newLine();
        $this->line('Both sets of credentials can be obtained from: https://developer.twitter.com/en/portal/dashboard');
        
        return 0;
    }
}
