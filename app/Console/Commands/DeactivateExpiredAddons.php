<?php

namespace App\Console\Commands;

use App\Services\WorkspaceAddonService;
use Illuminate\Console\Command;

class DeactivateExpiredAddons extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'addons:deactivate-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deactivate expired workspace addons';

    /**
     * Execute the console command.
     */
    public function handle(WorkspaceAddonService $addonService): int
    {
        $this->info('Deactivating expired addons...');

        $count = $addonService->deactivateExpiredAddons();

        $this->info("Deactivated {$count} expired addon(s).");

        return Command::SUCCESS;
    }
}
