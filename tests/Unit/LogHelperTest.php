<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Helpers\LogHelper;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class LogHelperTest extends TestCase
{
    public function test_publication_log_writes_to_correct_channel()
    {
        Log::shouldReceive('channel')
            ->once()
            ->with('publications')
            ->andReturnSelf();
        
        Log::shouldReceive('info')
            ->once()
            ->with('Test message', \Mockery::type('array'));

        LogHelper::publicationInfo('Test message', ['test' => true]);
    }

    public function test_job_log_writes_to_correct_channel()
    {
        Log::shouldReceive('channel')
            ->once()
            ->with('jobs')
            ->andReturnSelf();
        
        Log::shouldReceive('info')
            ->once()
            ->with('Job started', \Mockery::type('array'));

        LogHelper::jobInfo('Job started', ['job_id' => '123']);
    }

    public function test_auth_log_writes_to_correct_channel()
    {
        Log::shouldReceive('channel')
            ->once()
            ->with('auth')
            ->andReturnSelf();
        
        Log::shouldReceive('info')
            ->once()
            ->with('Login attempt', \Mockery::type('array'));

        LogHelper::auth('info', 'Login attempt', ['email' => 'test@example.com']);
    }

    public function test_social_log_writes_to_correct_channel()
    {
        Log::shouldReceive('channel')
            ->once()
            ->with('social')
            ->andReturnSelf();
        
        Log::shouldReceive('error')
            ->once()
            ->with('Facebook error', \Mockery::type('array'));

        LogHelper::social('error', 'Facebook error', ['account_id' => 123]);
    }

    public function test_error_log_writes_to_errors_channel()
    {
        Log::shouldReceive('channel')
            ->once()
            ->with('errors')
            ->andReturnSelf();
        
        Log::shouldReceive('error')
            ->once()
            ->with('Critical error', \Mockery::type('array'));

        LogHelper::error('Critical error', ['context' => 'test']);
    }

    public function test_publication_error_writes_to_multiple_channels()
    {
        // Should write to publications channel
        Log::shouldReceive('channel')
            ->once()
            ->with('publications')
            ->andReturnSelf();
        
        Log::shouldReceive('error')
            ->once()
            ->with('Publication failed', \Mockery::type('array'));

        // Should also write to errors channel
        Log::shouldReceive('channel')
            ->once()
            ->with('errors')
            ->andReturnSelf();
        
        Log::shouldReceive('error')
            ->once()
            ->with('Publication failed', \Mockery::type('array'));

        LogHelper::publicationError('Publication failed', ['publication_id' => 456]);
    }
}
