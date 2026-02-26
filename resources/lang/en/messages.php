<?php

return [
    // Workspace messages
    'workspace' => [
        'creator_role_change' => 'Cannot change workspace creator\'s role',
        'owner_role_assign' => 'Owner role cannot be assigned. It is reserved for the workspace creator.',
        'creator_remove' => 'Cannot remove workspace creator',
        'member_removed' => 'Member removed successfully',
        'member_added' => 'Member added successfully',
        'user_already_member' => 'User is already a member of this workspace',
    ],

    // Theme messages
    'theme' => [
        'updated' => 'Theme updated successfully',
    ],

    // Social Account messages
    'social_account' => [
        'platform_not_supported' => 'Platform not supported',
        'connected' => 'Account connected successfully',
        'connection_error' => 'Error saving account: :error',
        'disconnected' => 'Account disconnected successfully',
        'disconnect_error' => 'Error disconnecting account: :error',
        'cannot_disconnect_scheduled' => 'Cannot disconnect account. It has :count scheduled post(s). Please remove them from campaigns first.',
    ],

    // Publication messages
    'publication' => [
        'update_failed' => 'Update failed: :error',
        'approved' => 'Publication approved successfully.',
        'rejected' => 'Publication rejected successfully.',
        'config_optimized' => 'Configuration optimized automatically',
    ],

    // Profile messages
    'profile' => [
        'updated' => 'Profile updated successfully',
        'validation_failed' => 'Validation failed',
        'current_password_incorrect' => 'Current password is incorrect',
    ],

    // Campaign messages
    'campaign' => [
        'cannot_change_name' => 'Cannot change the name of a campaign that has published posts.',
        'export_failed' => 'Export failed: :error',
    ],

    // Scheduled Post messages
    'scheduled_post' => [
        'not_found' => 'Scheduled post not found',
        'deleted' => 'Scheduled post deleted successfully',
        'delete_error' => 'Error deleting scheduled post: :error',
    ],

    // Auth messages
    'auth' => [
        'user_registered' => 'User registered successfully',
        'not_authenticated' => 'User not authenticated',
        'user_not_found' => 'User not found',
        'unauthorized' => 'Unauthorized',
    ],

    // Locale messages
    'locale' => [
        'updated' => 'Locale updated successfully',
    ],

    // Upload messages
    'upload' => [
        'paused' => 'Upload paused successfully',
        'no_paused_upload' => 'No paused upload found',
        'upload_expired' => 'The upload may have expired or was never paused',
        'unauthorized_resume' => 'You do not have permission to resume this upload',
    ],

    // Reel messages
    'reel' => [
        'generation_started' => 'Reel generation started',
    ],

    // Onboarding messages
    'onboarding' => [
        'initialized' => 'Onboarding initialized successfully',
        'initialization_failed' => 'Failed to initialize onboarding',
        'step_completed' => 'Tour step completed successfully',
        'step_completion_failed' => 'Failed to complete tour step',
        'step_updated' => 'Tour step updated successfully',
    ],

    // Comment messages
    'comment' => [
        'unauthorized' => 'Unauthorized',
    ],

    // Generic messages
    'success' => 'Operation completed successfully',
    'error' => 'An error occurred',
];
