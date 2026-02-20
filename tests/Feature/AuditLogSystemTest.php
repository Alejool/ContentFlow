<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\AuditLog;

class AuditLogSystemTest extends TestCase
{
    /** @test */
    public function audit_log_model_exists_and_has_correct_structure()
    {
        $this->assertTrue(class_exists(AuditLog::class));
        
        $auditLog = new AuditLog();
        $fillable = $auditLog->getFillable();
        
        $this->assertContains('user_id', $fillable);
        $this->assertContains('action', $fillable);
        $this->assertContains('auditable_type', $fillable);
        $this->assertContains('auditable_id', $fillable);
        $this->assertContains('old_values', $fillable);
        $this->assertContains('new_values', $fillable);
        $this->assertContains('ip_address', $fillable);
        $this->assertContains('user_agent', $fillable);
        $this->assertContains('metadata', $fillable);
    }

    /** @test */
    public function audit_log_has_required_scopes()
    {
        $this->assertTrue(method_exists(AuditLog::class, 'scopeByUser'));
        $this->assertTrue(method_exists(AuditLog::class, 'scopeByAction'));
        $this->assertTrue(method_exists(AuditLog::class, 'scopeByDateRange'));
        $this->assertTrue(method_exists(AuditLog::class, 'scopeByIp'));
    }

    /** @test */
    public function auditable_events_exist()
    {
        $this->assertTrue(class_exists(\App\Events\AuditableEvent::class));
        $this->assertTrue(class_exists(\App\Events\ConfigurationChanged::class));
        $this->assertTrue(class_exists(\App\Events\RoleChanged::class));
        $this->assertTrue(class_exists(\App\Events\SocialTokenAccessed::class));
        $this->assertTrue(class_exists(\App\Events\AuthenticationFailed::class));
        $this->assertTrue(class_exists(\App\Events\CriticalDataDeleted::class));
    }

    /** @test */
    public function audit_logger_listener_exists()
    {
        $this->assertTrue(class_exists(\App\Listeners\AuditLogger::class));
        $this->assertTrue(method_exists(\App\Listeners\AuditLogger::class, 'handle'));
    }

    /** @test */
    public function clean_audit_logs_command_exists()
    {
        $this->assertTrue(class_exists(\App\Console\Commands\CleanOldAuditLogs::class));
    }
}
