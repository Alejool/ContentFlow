<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateDummyData extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'app:generate-dummy-data';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Generate dummy data for existing users';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    $this->info('Starting dummy data generation...');

    $this->call('db:seed', [
      '--class' => 'ExistingUserDummyDataSeeder'
    ]);

    $this->info('Dummy data generation completed.');
  }
}
