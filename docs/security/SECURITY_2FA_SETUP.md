# Two-Factor Authentication (2FA) Setup Guide

## Overview

ContentFlow requires all administrator accounts to use Two-Factor Authentication (2FA) for enhanced security. This guide covers the setup process, usage, and recovery procedures.

## What is 2FA?

Two-Factor Authentication adds an extra layer of security by requiring two forms of verification:
1. **Something you know**: Your password
2. **Something you have**: A time-based code from your authenticator app

## Supported Authenticator Apps

ContentFlow uses the industry-standard TOTP (Time-based One-Time Password) protocol, compatible with:

- **Google Authenticator** (iOS, Android)
- **Authy** (iOS, Android, Desktop)
- **Microsoft Authenticator** (iOS, Android)
- **1Password** (iOS, Android, Desktop, Browser)
- **Bitwarden** (iOS, Android, Desktop, Browser)
- **Any TOTP-compatible app**

## Initial Setup (For Administrators)

### Step 1: Automatic Redirect

When an administrator logs in without 2FA configured, they are automatically redirected to the setup page.

### Step 2: Scan QR Code

1. Open your authenticator app
2. Select "Add Account" or "Scan QR Code"
3. Scan the QR code displayed on the setup page
4. The app will add a new entry for ContentFlow

**Alternative**: If you can't scan the QR code, manually enter the secret key shown below the QR code.

### Step 3: Save Backup Codes

**CRITICAL**: Save your backup codes in a secure location!

- 8 unique backup codes are generated during setup
- Each code can only be used once
- Store them in a password manager or secure physical location
- These codes are your only recovery method if you lose your device

### Step 4: Verify Setup

1. Enter a 6-digit code from your authenticator app
2. Click "Verify and Enable 2FA"
3. If successful, 2FA is now active on your account

## Daily Usage

### Logging In

1. Enter your email and password as usual
2. After password verification, you'll be prompted for a 2FA code
3. Open your authenticator app
4. Enter the current 6-digit code
5. Click "Verify"

**Note**: Codes refresh every 30 seconds. If a code doesn't work, wait for the next one.

### Code Timing

- Each code is valid for 30 seconds
- The system accepts codes from the current and previous time window (60 seconds total)
- This provides a buffer for clock synchronization issues

## Recovery Procedures

### Lost Authenticator Device

If you lose access to your authenticator device:

1. Navigate to the 2FA verification page
2. Click "Use a backup code instead"
3. Enter one of your saved backup codes
4. You'll be logged in successfully

**After Recovery**:
- Immediately set up 2FA on a new device
- Generate new backup codes
- The used backup code is automatically invalidated

### Lost Backup Codes

If you lose both your authenticator device AND backup codes:

1. Contact a system administrator or super admin
2. They can temporarily disable 2FA on your account
3. Log in and immediately set up 2FA again
4. Save your new backup codes securely

**Security Note**: This process requires verification of your identity through alternative means.

## Best Practices

### Security

1. **Never share your 2FA secret key or backup codes**
2. **Store backup codes securely** - treat them like passwords
3. **Use a reputable authenticator app** from the list above
4. **Set up 2FA on multiple devices** if your authenticator app supports sync
5. **Regenerate backup codes** if you suspect they've been compromised

### Convenience

1. **Use an authenticator app with cloud backup** (Authy, 1Password, Bitwarden)
2. **Keep backup codes in your password manager**
3. **Set up 2FA on both phone and tablet** for redundancy
4. **Test a backup code** after setup to ensure they work

## Troubleshooting

### "Invalid verification code" Error

**Possible causes**:
- Code expired (wait for next code)
- Device clock out of sync
- Typo in the code

**Solutions**:
1. Wait for the next code to generate
2. Check your device's time settings (should be automatic)
3. Ensure you're entering the code from the correct account
4. Try a backup code instead

### QR Code Won't Scan

**Solutions**:
1. Increase screen brightness
2. Try a different authenticator app
3. Use manual entry with the secret key shown below the QR code

### Backup Codes Not Working

**Possible causes**:
- Code already used
- Typo in the code
- Codes from a previous setup

**Solutions**:
1. Try a different backup code
2. Ensure you're using codes from the current setup
3. Contact an administrator for account recovery

### Lost Access to Everything

If you've lost both your authenticator device and backup codes:

1. Contact your system administrator at: [admin-email]
2. Provide proof of identity
3. Administrator will temporarily disable 2FA
4. Log in and immediately reconfigure 2FA
5. Save new backup codes securely

## Administrative Functions

### Disabling 2FA for a User (Admin Only)

If a user is locked out:

```bash
php artisan tinker
```

```php
$user = User::where('email', 'user@example.com')->first();
$user->two_factor_secret = null;
$user->two_factor_backup_codes = null;
$user->two_factor_enabled_at = null;
$user->save();
```

**Security Note**: This action is logged in the audit trail.

### Forcing 2FA for All Admins

2FA is automatically enforced for all users with the `admin` role through the `Require2FA` middleware.

To extend to other roles, edit `app/Http/Middleware/Require2FA.php`:

```php
// Check for multiple roles
if (!$user || !in_array($user->role, ['admin', 'super_admin', 'manager'])) {
    return $next($request);
}
```

## Security Considerations

### Why 2FA is Required for Admins

Administrator accounts have elevated privileges including:
- Access to all user data
- Ability to modify system configuration
- Access to social media tokens
- Ability to delete critical data

2FA significantly reduces the risk of:
- Password compromise
- Phishing attacks
- Credential stuffing
- Unauthorized access

### Audit Trail

All 2FA-related actions are logged:
- 2FA enabled/disabled
- Successful verifications
- Failed verification attempts
- Backup code usage

Access these logs through the admin panel under "Audit Logs".

## Technical Details

### TOTP Algorithm

ContentFlow uses the standard TOTP algorithm (RFC 6238):
- **Algorithm**: HMAC-SHA1
- **Time Step**: 30 seconds
- **Code Length**: 6 digits
- **Time Window**: ±1 period (60 seconds total)

### Encryption

- 2FA secrets are encrypted using Laravel's encryption (AES-256-CBC)
- Backup codes are encrypted before storage
- Encryption key is stored in `.env` file (`APP_KEY`)

### Storage

2FA data is stored in the `users` table:
- `two_factor_secret`: Encrypted TOTP secret
- `two_factor_backup_codes`: Encrypted JSON array of backup codes
- `two_factor_enabled_at`: Timestamp of 2FA activation

## Support

For additional help:
- Check the [Security FAQ](SECURITY_FAQ.md)
- Contact your system administrator
- Review audit logs for failed attempts
- Consult the [Troubleshooting Guide](../TROUBLESHOOTING.md)

---

**Last Updated**: 2026-02-19
**Version**: 1.0
