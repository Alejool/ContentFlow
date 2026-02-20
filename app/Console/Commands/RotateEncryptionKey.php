<?php

namespace App\Console\Commands;

use App\Models\Social\SocialAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RotateEncryptionKey extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'encryption:rotate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rotate encryption key and re-encrypt all tokens';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $oldKey = config('app.key');
        $newKey = 'base64:' . base64_encode(random_bytes(32));
        
        // Obtener todos los tokens
        $accounts = SocialAccount::all();
        
        $this->info("Re-encrypting {$accounts->count()} social accounts...");
        
        try {
            DB::transaction(function() use ($accounts, $oldKey, $newKey) {
                foreach ($accounts as $account) {
                    // Desencriptar con clave vieja
                    config(['app.key' => $oldKey]);
                    $accessToken = $account->access_token;
                    $refreshToken = $account->refresh_token;
                    
                    // Encriptar con clave nueva
                    config(['app.key' => $newKey]);
                    $account->access_token = $accessToken;
                    $account->refresh_token = $refreshToken;
                    $account->saveQuietly(); // Sin disparar eventos
                    
                    $this->info("Re-encrypted account ID: {$account->id}");
                }
            });
            
            // Actualizar .env
            $this->updateEnvFile('APP_KEY', $newKey);
            
            $this->info('Encryption key rotated successfully');
            $this->warn('IMPORTANT: Restart your application to use the new key');
            
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to rotate encryption key: ' . $e->getMessage());
            return 1;
        }
    }
    
    /**
     * Update the .env file with the new key.
     *
     * @param string $key
     * @param string $value
     * @return void
     */
    private function updateEnvFile(string $key, string $value): void
    {
        $path = base_path('.env');
        
        if (!file_exists($path)) {
            $this->warn('.env file not found. Please update APP_KEY manually.');
            $this->line("New key: {$value}");
            return;
        }
        
        $content = file_get_contents($path);
        
        $pattern = "/^{$key}=.*/m";
        $replacement = "{$key}={$value}";
        
        $content = preg_replace($pattern, $replacement, $content);
        file_put_contents($path, $content);
        
        $this->info('.env file updated with new encryption key');
    }
}
