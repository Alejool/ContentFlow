<?php

return [
    // Mensajes de Workspace
    'workspace' => [
        'creator_role_change' => 'No se puede cambiar el rol del creador del espacio de trabajo',
        'owner_role_assign' => 'El rol de propietario no se puede asignar. Está reservado para el creador del espacio de trabajo.',
        'creator_remove' => 'No se puede eliminar al creador del espacio de trabajo',
        'member_removed' => 'Miembro eliminado exitosamente',
        'member_added' => 'Miembro agregado exitosamente',
        'user_already_member' => 'El usuario ya es miembro de este espacio de trabajo',
    ],

    // Mensajes de Tema
    'theme' => [
        'updated' => 'Tema actualizado exitosamente',
    ],

    // Mensajes de Cuenta Social
    'social_account' => [
        'platform_not_supported' => 'Plataforma no soportada',
        'connected' => 'Cuenta conectada exitosamente',
        'connection_error' => 'Error al guardar la cuenta: :error',
        'disconnected' => 'Cuenta desconectada exitosamente',
        'disconnect_error' => 'Error al desconectar la cuenta: :error',
        'cannot_disconnect_scheduled' => 'No se puede desconectar la cuenta. Tiene :count publicación(es) programada(s). Por favor, elimínelas de las campañas primero.',
    ],

    // Mensajes de Publicación
    'publication' => [
        'update_failed' => 'Actualización fallida: :error',
        'approved' => 'Publicación aprobada exitosamente.',
        'rejected' => 'Publicación rechazada exitosamente.',
        'config_optimized' => 'Configuración optimizada automáticamente',
    ],

    // Mensajes de Perfil
    'profile' => [
        'updated' => 'Perfil actualizado exitosamente',
        'validation_failed' => 'Validación fallida',
        'current_password_incorrect' => 'La contraseña actual es incorrecta',
    ],

    // Mensajes de Campaña
    'campaign' => [
        'cannot_change_name' => 'No se puede cambiar el nombre de una campaña que tiene publicaciones publicadas.',
        'export_failed' => 'Exportación fallida: :error',
    ],

    // Mensajes de Publicación Programada
    'scheduled_post' => [
        'not_found' => 'Publicación programada no encontrada',
        'deleted' => 'Publicación programada eliminada exitosamente',
        'delete_error' => 'Error al eliminar la publicación programada: :error',
    ],

    // Mensajes de Autenticación
    'auth' => [
        'user_registered' => 'Usuario registrado exitosamente',
        'not_authenticated' => 'Usuario no autenticado',
        'user_not_found' => 'Usuario no encontrado',
        'unauthorized' => 'No autorizado',
    ],

    // Mensajes de Idioma
    'locale' => [
        'updated' => 'Idioma actualizado exitosamente',
    ],

    // Mensajes de Carga
    'upload' => [
        'paused' => 'Carga pausada exitosamente',
        'no_paused_upload' => 'No se encontró ninguna carga pausada',
        'upload_expired' => 'La carga puede haber expirado o nunca fue pausada',
        'unauthorized_resume' => 'No tienes permiso para reanudar esta carga',
    ],

    // Mensajes de Reel
    'reel' => [
        'generation_started' => 'Generación de reel iniciada',
    ],

    // Mensajes de Onboarding
    'onboarding' => [
        'initialized' => 'Onboarding inicializado exitosamente',
        'initialization_failed' => 'Falló la inicialización del onboarding',
        'step_completed' => 'Paso del tour completado exitosamente',
        'step_completion_failed' => 'Falló la finalización del paso del tour',
        'step_updated' => 'Paso del tour actualizado exitosamente',
    ],

    // Mensajes de Comentario
    'comment' => [
        'unauthorized' => 'No autorizado',
    ],

    // Mensajes genéricos
    'success' => 'Operación completada exitosamente',
    'error' => 'Ocurrió un error',
];
