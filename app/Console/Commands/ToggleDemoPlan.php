<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ToggleDemoPlan extends Command
{
    protected $signature = 'demo:toggle {action=status : enable, disable, or status}';
    protected $description = 'Enable or disable the demo plan';

    public function handle(): int
    {
        $action = $this->argument('action');
        $envPath = base_path('.env');

        if (!File::exists($envPath)) {
            $this->error('.env file not found');
            return Command::FAILURE;
        }

        $envContent = File::get($envPath);

        switch ($action) {
            case 'enable':
                if (str_contains($envContent, 'DEMO_PLAN_ENABLED=')) {
                    $envContent = preg_replace(
                        '/DEMO_PLAN_ENABLED=.*/m',
                        'DEMO_PLAN_ENABLED=true',
                        $envContent
                    );
                } else {
                    $envContent .= "\nDEMO_PLAN_ENABLED=true\n";
                }

                File::put($envPath, $envContent);
                $this->info('✓ Demo plan enabled');
                $this->info('Users can now activate the demo plan from the pricing page');
                break;

            case 'disable':
                if (str_contains($envContent, 'DEMO_PLAN_ENABLED=')) {
                    $envContent = preg_replace(
                        '/DEMO_PLAN_ENABLED=.*/m',
                        'DEMO_PLAN_ENABLED=false',
                        $envContent
                    );
                } else {
                    $envContent .= "\nDEMO_PLAN_ENABLED=false\n";
                }

                File::put($envPath, $envContent);
                $this->warn('✓ Demo plan disabled');
                $this->info('Users will not be able to activate new demo plans');
                $this->info('Existing demo plans will continue until expiration');
                break;

            case 'status':
                $enabled = env('DEMO_PLAN_ENABLED', true);
                $this->info('Demo Plan Status: ' . ($enabled ? 'ENABLED' : 'DISABLED'));
                
                if ($enabled) {
                    $this->info('Users can activate the demo plan from /pricing');
                } else {
                    $this->warn('Demo plan is currently disabled');
                }
                break;

            default:
                $this->error('Invalid action. Use: enable, disable, or status');
                return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
