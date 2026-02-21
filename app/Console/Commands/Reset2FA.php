<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class Reset2FA extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:reset-2fa {email? : The email of the user}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset 2FA for a user or all users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        if ($email) {
            // Reset para un usuario específico
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                $this->error("User with email {$email} not found.");
                return 1;
            }

            $user->update([
                'two_factor_secret' => null,
                'two_factor_backup_codes' => null,
                'two_factor_enabled_at' => null,
            ]);

            $this->info("2FA has been reset for user: {$user->email}");
        } else {
            // Reset para todos los usuarios
            if (!$this->confirm('This will reset 2FA for ALL users. Are you sure?')) {
                $this->info('Operation cancelled.');
                return 0;
            }

            $count = User::whereNotNull('two_factor_secret')->count();
            
            User::whereNotNull('two_factor_secret')->update([
                'two_factor_secret' => null,
                'two_factor_backup_codes' => null,
                'two_factor_enabled_at' => null,
            ]);

            $this->info("2FA has been reset for {$count} users.");
        }

        return 0;
    }
}
