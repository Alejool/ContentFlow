<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DiagnoseS3Upload extends Command
{
    protected $signature = 'diagnose:s3-upload';
    protected $description = 'Diagnose S3 upload configuration and connectivity';

    public function handle()
    {
        $this->info('🔍 Diagnosing S3 Upload Configuration...');
        $this->newLine();

        // 1. Check filesystem configuration
        $this->info('1️⃣ Checking Filesystem Configuration');
        $defaultDisk = config('filesystems.default');
        $this->line("   Default disk: {$defaultDisk}");

        if ($defaultDisk !== 's3') {
            $this->warn("   ⚠️  Default disk is not 's3'. Direct uploads require S3.");
            return 1;
        }

        // 2. Check S3 configuration
        $this->info('2️⃣ Checking S3 Configuration');
        $s3Config = config('filesystems.disks.s3');
        
        $requiredKeys = ['key', 'secret', 'region', 'bucket'];
        $missingKeys = [];
        
        foreach ($requiredKeys as $key) {
            if (empty($s3Config[$key])) {
                $missingKeys[] = $key;
            } else {
                $value = $key === 'secret' ? '***' : $s3Config[$key];
                $this->line("   ✓ {$key}: {$value}");
            }
        }

        if (!empty($missingKeys)) {
            $this->error("   ❌ Missing S3 configuration: " . implode(', ', $missingKeys));
            return 1;
        }

        // 3. Test S3 connectivity
        $this->info('3️⃣ Testing S3 Connectivity');
        try {
            $testKey = 'test/' . Str::uuid() . '.txt';
            $testContent = 'S3 connectivity test - ' . now()->toDateTimeString();
            
            $this->line("   Attempting to write test file: {$testKey}");
            Storage::disk('s3')->put($testKey, $testContent);
            $this->line("   ✓ Write successful");

            $this->line("   Attempting to read test file...");
            $retrieved = Storage::disk('s3')->get($testKey);
            
            if ($retrieved === $testContent) {
                $this->line("   ✓ Read successful");
            } else {
                $this->error("   ❌ Read failed: content mismatch");
                return 1;
            }

            $this->line("   Attempting to delete test file...");
            Storage::disk('s3')->delete($testKey);
            $this->line("   ✓ Delete successful");

            $this->newLine();
            $this->info('✅ S3 connectivity test passed!');

        } catch (\Exception $e) {
            $this->error("   ❌ S3 connectivity test failed:");
            $this->error("   {$e->getMessage()}");
            $this->newLine();
            $this->warn('Common issues:');
            $this->line('   • Invalid AWS credentials (check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)');
            $this->line('   • Incorrect region (check AWS_DEFAULT_REGION)');
            $this->line('   • Bucket does not exist or wrong name (check AWS_BUCKET)');
            $this->line('   • IAM permissions insufficient (need s3:PutObject, s3:GetObject, s3:DeleteObject)');
            $this->line('   • Network connectivity issues');
            return 1;
        }

        // 4. Test presigned URL generation
        $this->info('4️⃣ Testing Presigned URL Generation');
        try {
            $client = Storage::disk('s3')->getClient();
            $bucket = config('filesystems.disks.s3.bucket');
            $testKey = 'publications/test-' . Str::uuid() . '.txt';

            $cmd = $client->getCommand('PutObject', [
                'Bucket' => $bucket,
                'Key' => $testKey,
                'ContentType' => 'text/plain',
            ]);

            $request = $client->createPresignedRequest($cmd, '+20 minutes');
            $presignedUrl = (string)$request->getUri();

            $this->line("   ✓ Presigned URL generated successfully");
            $this->line("   URL length: " . strlen($presignedUrl) . " characters");

        } catch (\Exception $e) {
            $this->error("   ❌ Presigned URL generation failed:");
            $this->error("   {$e->getMessage()}");
            return 1;
        }

        // 5. Check publications directory
        $this->info('5️⃣ Checking Publications Directory');
        try {
            $files = Storage::disk('s3')->files('publications');
            $this->line("   ✓ Publications directory accessible");
            $this->line("   Files found: " . count($files));
            
            if (count($files) > 0) {
                $this->line("   Recent files:");
                foreach (array_slice($files, -3) as $file) {
                    $size = Storage::disk('s3')->size($file);
                    $this->line("     • {$file} (" . $this->formatBytes($size) . ")");
                }
            }

        } catch (\Exception $e) {
            $this->warn("   ⚠️  Could not list publications directory:");
            $this->warn("   {$e->getMessage()}");
        }

        $this->newLine();
        $this->info('🎉 All diagnostics passed! S3 upload should be working.');
        $this->newLine();
        $this->line('If uploads are still failing, check:');
        $this->line('  • Browser console for JavaScript errors');
        $this->line('  • Laravel logs: storage/logs/laravel.log');
        $this->line('  • Queue worker is running: php artisan queue:work');
        $this->line('  • CORS configuration on S3 bucket');

        return 0;
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
