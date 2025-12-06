<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Exception;

class WaitForDatabase extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'wait-for-db {--timeout=60 : Maximum time to wait in seconds}';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Wait for database connection to be available';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    $timeout = (int) $this->option('timeout');
    $start = time();

    $this->info('Waiting for database connection...');

    while (true) {
      try {
        DB::connection()->getPdo();
        $elapsed = time() - $start;
        $this->info("Database connection established after {$elapsed} seconds");
        return 0;
      } catch (Exception $e) {
        $elapsed = time() - $start;

        if ($elapsed >= $timeout) {
          $this->error("Database connection timeout after {$timeout} seconds");
          $this->error("Error: " . $e->getMessage());
          return 1;
        }

        $this->line("Waiting for database... ({$elapsed}s)");
        sleep(1);
      }
    }
  }
}
