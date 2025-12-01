<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordRecoveryMail extends Mailable
{
    use Queueable, SerializesModels;

    public $token;
    public $email;

    /**
     * Create a new message instance.
     *
     * @param string $token
     * @param string $email
     */
    public function __construct(string $token, string $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $resetUrl = url(route('password.reset', ['token' => $this->token, 'email' => $this->email]));
        return $this->subject('Password Recovery')
                    ->view('emails.password_recovery')
                    ->with([
                        'resetUrl' => $resetUrl,
                    ]);
    }
}
