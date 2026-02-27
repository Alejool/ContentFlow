<?php

return [
  'title' => 'Tus Publicaciones',
  'subtitle' => 'Administra y rastrea tu contenido social',
  'table' => [
    'campaign' => 'Campaña',
    'media' => 'Multimedia',
  ],
  'filters' => [
    'title' => 'Filtrar Publicaciones',
  ],
  'button' => [
    'addPublication' => 'Nueva Publicación',
    'approve' => 'Aprobar',
    'reject' => 'Rechazar',
  ],
  'noCampaign' => 'Sin Campaña',
  'edit' => [
    'accountMissingTitle' => 'Cuenta Desconectada',
    'accountMissingText' => 'Esta publicación fue publicada en una cuenta (:account) que ya no está conectada. Editarla creará una nueva versión para tus cuentas actuales. ¿Proceder?',
  ],
  'validation' => [
    'scheduledMinDifference' => 'La fecha debe ser al menos 1 minuto después de la actual.',
  ],
  'errors' => [
    'only_draft_failed_rejected_can_request_review' => 'Solo las publicaciones en borrador, fallidas o rechazadas pueden enviarse para revisión.',
    'not_approved' => 'Esta publicación requiere aprobación antes de publicarse. Por favor, solicita aprobación primero.',
    'pending_review' => 'Esta publicación está pendiente de revisión. Debe ser aprobada o rechazada antes de poder publicarse.',
  ],
  'status' => [
    'publishingProgress' => ':current/:total publicando',
    'partialSuccess' => ':success/:total publicado',
    'allPublished' => ':total/:total publicado',
  ],
  'viewPost' => 'Ver publicación',
];
