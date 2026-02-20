<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;
use Inertia\Inertia;

class TwoFactorController extends Controller
{
    private Google2FA $google2fa;
    
    public function __construct(Google2FA $google2fa)
    {
        $this->google2fa = $google2fa;
    }
    
    /**
     * Show the 2FA setup form.
     */
    public function setupForm()
    {
        $user = auth()->user();
        
        // Generar secreto
        $secret = $this->google2fa->generateSecretKey();
        
        // Generar QR code URL
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );
        
        // Generar códigos de respaldo
        $backupCodes = $this->generateBackupCodes();
        
        // Guardar temporalmente en sesión
        session([
            '2fa_secret_temp' => $secret,
            '2fa_backup_codes_temp' => $backupCodes,
        ]);
        
        return Inertia::render('Auth/TwoFactor/Setup', [
            'qrCodeUrl' => $qrCodeUrl,
            'secret' => $secret,
            'backupCodes' => $backupCodes,
        ]);
    }
    
    /**
     * Store the 2FA configuration.
     */
    public function setupStore(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);
        
        $secret = session('2fa_secret_temp');
        $valid = $this->google2fa->verifyKey($secret, $request->code);
        
        if (!$valid) {
            return back()->withErrors(['code' => 'Invalid verification code']);
        }
        
        // Guardar configuración
        $user = auth()->user();
        $user->update([
            'two_factor_secret' => encrypt($secret),
            'two_factor_backup_codes' => encrypt(json_encode(session('2fa_backup_codes_temp'))),
            'two_factor_enabled_at' => now(),
        ]);
        
        session()->forget(['2fa_secret_temp', '2fa_backup_codes_temp']);
        session(['2fa_verified' => true]);
        
        // Disparar evento de auditoría
        AuditLog::create([
            'user_id' => $user->id,
            'action' => '2fa_enabled',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        return redirect()->route('dashboard')
            ->with('success', '2FA has been enabled successfully');
    }
    
    /**
     * Generate backup codes.
     */
    private function generateBackupCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(Str::random(8));
        }
        return $codes;
    }

    /**
     * Show the 2FA verification form.
     */
    public function verifyForm()
    {
        return Inertia::render('Auth/TwoFactor/Verify');
    }
    
    /**
     * Verify the 2FA code.
     */
    public function verifyStore(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);
        
        $user = auth()->user();
        $secret = decrypt($user->two_factor_secret);
        
        // Intentar código TOTP
        $valid = $this->google2fa->verifyKey($secret, $request->code, 2); // 2 ventanas de tiempo
        
        // Si falla, intentar código de respaldo
        if (!$valid) {
            $valid = $this->verifyBackupCode($user, $request->code);
        }
        
        if (!$valid) {
            // Disparar evento de auditoría para intento fallido
            AuditLog::create([
                'user_id' => $user->id,
                'action' => '2fa_failed',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            
            return back()->withErrors(['code' => 'Invalid verification code']);
        }
        
        session(['2fa_verified' => true]);
        
        // Disparar evento de auditoría para intento exitoso
        AuditLog::create([
            'user_id' => $user->id,
            'action' => '2fa_verified',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        return redirect()->intended(route('dashboard'));
    }
    
    /**
     * Verify a backup code.
     */
    private function verifyBackupCode(User $user, string $code): bool
    {
        $backupCodes = json_decode(decrypt($user->two_factor_backup_codes), true);
        
        if (in_array($code, $backupCodes)) {
            // Remover código usado
            $backupCodes = array_diff($backupCodes, [$code]);
            $user->update([
                'two_factor_backup_codes' => encrypt(json_encode(array_values($backupCodes))),
            ]);
            
            return true;
        }
        
        return false;
    }
}
