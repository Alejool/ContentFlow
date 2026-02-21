<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;
use Inertia\Inertia;
use App\Notifications\TwoFactorEnabledNotification;

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
    public function setupForm(Request $request)
    {
        $user = auth()->user();
        
        // Si ya tiene 2FA configurado, redirigir al dashboard
        if ($user->two_factor_secret) {
            return redirect()->route('dashboard')
                ->with('info', '2FA is already configured for your account');
        }
        
        // Generar secreto
        $secret = $this->google2fa->generateSecretKey();
        
        // Generar QR code URL (otpauth://)
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );
        
        // Generar códigos de respaldo
        $backupCodes = $this->generateBackupCodes();
        
        // Guardar temporalmente en sesión con timestamp
        session([
            '2fa_secret_temp' => $secret,
            '2fa_backup_codes_temp' => $backupCodes,
            '2fa_setup_started_at' => now()->timestamp,
        ]);
        
        // Log de auditoría - alguien está intentando configurar 2FA
        AuditLog::create([
            'user_id' => $user->id,
            'action' => '2fa_setup_started',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        return Inertia::render('Auth/TwoFactor/Setup', [
            'qrCodeUrl' => $qrCodeUrl,
            'secret' => $secret,
            'backupCodes' => $backupCodes,
            'userEmail' => $user->email, // Para mostrar en la UI
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
        $setupStartedAt = session('2fa_setup_started_at');
        
        if (!$secret) {
            return back()->withErrors(['code' => 'Session expired. Please refresh the page and try again.']);
        }
        
        // Verificar que la configuración no haya expirado (15 minutos)
        if (!$setupStartedAt || now()->timestamp - $setupStartedAt > 900) {
            session()->forget(['2fa_secret_temp', '2fa_backup_codes_temp', '2fa_setup_started_at']);
            return redirect()->route('2fa.setup')
                ->with('error', 'Setup session expired. Please start again.');
        }
        
        // Verificar el código con una ventana de tiempo más amplia (4 ventanas = ±2 minutos)
        $valid = $this->google2fa->verifyKey($secret, $request->code, 4);
        
        if (!$valid) {
            return back()->withErrors(['code' => 'Invalid verification code. Please check your authenticator app and try again.']);
        }
        
        // Guardar configuración
        $user = auth()->user();
        $user->update([
            'two_factor_secret' => encrypt($secret),
            'two_factor_backup_codes' => encrypt(json_encode(session('2fa_backup_codes_temp'))),
            'two_factor_enabled_at' => now(),
        ]);
        
        session()->forget(['2fa_secret_temp', '2fa_backup_codes_temp', '2fa_setup_started_at']);
        
        // Marcar la sesión como verificada por 30 días
        session([
            '2fa_verified_' . $user->id => true,
            '2fa_verified_at_' . $user->id => now()->timestamp,
        ]);
        
        // Disparar evento de auditoría
        AuditLog::create([
            'user_id' => $user->id,
            'action' => '2fa_enabled',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => json_encode([
                'setup_duration_seconds' => now()->timestamp - $setupStartedAt,
            ]),
        ]);
        
        // Enviar notificación por email al usuario
        $user->notify(new TwoFactorEnabledNotification($request->ip(), $request->userAgent()));
        
        return redirect()->route('dashboard')
            ->with('success', '2FA has been enabled successfully. Your account is now more secure.');
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
        
        if (!$user->two_factor_secret) {
            return redirect()->route('2fa.setup')
                ->with('error', '2FA is not configured for your account');
        }
        
        $secret = decrypt($user->two_factor_secret);
        
        // Intentar código TOTP con ventana de tiempo más amplia (4 ventanas = ±2 minutos)
        $valid = $this->google2fa->verifyKey($secret, $request->code, 4);
        
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
            
            return back()->withErrors(['code' => 'Invalid verification code. Please try again.']);
        }
        
        // Marcar la sesión como verificada por 30 días
        session([
            '2fa_verified_' . $user->id => true,
            '2fa_verified_at_' . $user->id => now()->timestamp,
        ]);
        
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
    
    /**
     * Disable 2FA for the user.
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);
        
        $user = auth()->user();
        
        // Verificar contraseña
        if (!password_verify($request->password, $user->password)) {
            return back()->withErrors(['password' => 'Invalid password']);
        }
        
        // Desactivar 2FA
        $user->update([
            'two_factor_secret' => null,
            'two_factor_backup_codes' => null,
            'two_factor_enabled_at' => null,
        ]);
        
        // Limpiar sesión
        session()->forget('2fa_verified_' . $user->id);
        
        // Auditoría
        AuditLog::create([
            'user_id' => $user->id,
            'action' => '2fa_disabled',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        return redirect()->route('profile.edit')
            ->with('success', '2FA has been disabled');
    }
    
    /**
     * Regenerate backup codes.
     */
    public function regenerateBackupCodes(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);
        
        $user = auth()->user();
        
        if (!$user->two_factor_secret) {
            return back()->withErrors(['error' => '2FA is not enabled']);
        }
        
        $secret = decrypt($user->two_factor_secret);
        $valid = $this->google2fa->verifyKey($secret, $request->code, 2);
        
        if (!$valid) {
            return back()->withErrors(['code' => 'Invalid verification code']);
        }
        
        // Generar nuevos códigos
        $backupCodes = $this->generateBackupCodes();
        
        $user->update([
            'two_factor_backup_codes' => encrypt(json_encode($backupCodes)),
        ]);
        
        // Auditoría
        AuditLog::create([
            'user_id' => $user->id,
            'action' => '2fa_backup_codes_regenerated',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        return back()->with([
            'success' => 'Backup codes regenerated successfully',
            'backup_codes' => $backupCodes,
        ]);
    }
}
