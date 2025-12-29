<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class PublicationApprovedNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_NORMAL;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected $publication,
        protected $approver
    ) {
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Publicación Aprobada',
            'message' => "Tu publicación \"{$this->publication->title}\" ha sido aprobada.",
            'description' => "Aprobado por {$this->approver->name}",
            'status' => 'success',
            'icon' => 'CheckCircle',
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'action' => $this->createAction(
                'Ver',
                route('publications.show', $this->publication->id)
            ),
        ];
    }
}
