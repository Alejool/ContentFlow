<?php

namespace App\Notifications;

use App\Notifications\BaseNotification;

class PublicationRejectedNotification extends BaseNotification
{
    protected string $priority = self::PRIORITY_HIGH;
    protected string $category = self::CATEGORY_APPLICATION;

    public function __construct(
        protected $publication,
        protected $rejector
    ) {
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Publicación Rechazada',
            'message' => "Tu publicación \"{$this->publication->title}\" ha sido rechazada.",
            'description' => "Rechazado por {$this->rejector->name}",
            'status' => 'error',
            'icon' => 'XCircle',
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'rejection_reason' => $this->publication->rejection_reason,
            'rejected_by' => $this->rejector->name,
            'rejected_at' => $this->publication->rejected_at,
            'action' => $this->createAction(
                'Ver Detalles',
                route('manage-content.index', ['tab' => 'publications', 'id' => $this->publication->id])
            ),
        ];
    }
}
