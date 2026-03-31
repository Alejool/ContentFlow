<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class PublicationAwaitingApprovalNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_HIGH;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected $publication,
        protected int $approvalLevel
    ) {}

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Aprobación Requerida',
            'message' => "La publicación \"{$this->publication->title}\" requiere tu revisión.",
            'description' => "Nivel {$this->approvalLevel} - Solicitado por {$this->publication->user->name}",
            'status' => 'warning',
            'icon' => 'Clock',
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'approval_level' => $this->approvalLevel,
            'action' => $this->createAction(
                'Revisar',
                route('api.v1.publications.show', $this->publication->id)
            ),
        ];
    }
}
