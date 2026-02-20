<?php

namespace App\Casts;

use App\Events\SocialTokenAccessed;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class EncryptedToken implements CastsAttributes
{
    /**
     * Cast the given value.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  mixed  $value
     * @param  array  $attributes
     * @return string|null
     */
    public function get($model, string $key, $value, array $attributes): ?string
    {
        if (is_null($value)) {
            return null;
        }
        
        try {
            $decrypted = Crypt::decryptString($value);
            
            // Registrar acceso
            event(new SocialTokenAccessed(
                action: 'token_accessed',
                auditable: $model,
                metadata: [
                    'token_field' => $key,
                    'provider' => $model->provider ?? 'unknown',
                ]
            ));
            
            return $decrypted;
        } catch (DecryptException $e) {
            Log::error('Token decryption failed', [
                'model' => get_class($model),
                'model_id' => $model->id,
                'field' => $key,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }
    
    /**
     * Prepare the given value for storage.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  mixed  $value
     * @param  array  $attributes
     * @return string|null
     */
    public function set($model, string $key, $value, array $attributes): ?string
    {
        if (is_null($value)) {
            return null;
        }
        
        return Crypt::encryptString($value);
    }
}
