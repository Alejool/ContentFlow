<?php

namespace App\Constants;

/**
 * Canonical event-type registry for the integration event system.
 *
 * HOW TO ADD A NEW EVENT:
 * 1. Add a constant here.
 * 2. Add its metadata to self::definitions().
 * 3. Dispatch it: IntegrationEventDispatcher::dispatch(IntegrationEvents::YOUR_EVENT, $payload).
 *    The dispatcher will deliver to all active subscriptions for that event type.
 */
class IntegrationEvents
{
    // ── Publications ─────────────────────────────────────────────────────────
    const PUBLICATION_CREATED   = 'publication.created';
    const PUBLICATION_UPDATED   = 'publication.updated';
    const PUBLICATION_DELETED   = 'publication.deleted';
    const PUBLICATION_PUBLISHED = 'publication.published';
    const PUBLICATION_SCHEDULED = 'publication.scheduled';
    const PUBLICATION_FAILED    = 'publication.failed';

    // ── Approvals ────────────────────────────────────────────────────────────
    const APPROVAL_SUBMITTED    = 'approval.submitted';
    const APPROVAL_APPROVED     = 'approval.approved';
    const APPROVAL_REJECTED     = 'approval.rejected';
    const APPROVAL_CANCELLED    = 'approval.cancelled';
    const APPROVAL_AUTO_ADVANCED = 'approval.auto_advanced';

    // ── Users ────────────────────────────────────────────────────────────────
    const USER_CREATED          = 'user.created';
    const USER_REMOVED          = 'user.removed';
    const USER_ROLE_CHANGED     = 'user.role_changed';

    // ── System ───────────────────────────────────────────────────────────────
    const ERROR_CRITICAL        = 'error.critical';
    const SECURITY_EVENT        = 'security.event';

    /**
     * Human-readable metadata for each event type.
     * Used by the UI to display event subscription options.
     */
    public static function definitions(): array
    {
        return [
            self::PUBLICATION_CREATED   => ['group' => 'publications', 'label' => 'Publication created'],
            self::PUBLICATION_UPDATED   => ['group' => 'publications', 'label' => 'Publication updated'],
            self::PUBLICATION_DELETED   => ['group' => 'publications', 'label' => 'Publication deleted'],
            self::PUBLICATION_PUBLISHED => ['group' => 'publications', 'label' => 'Publication published'],
            self::PUBLICATION_SCHEDULED => ['group' => 'publications', 'label' => 'Publication scheduled'],
            self::PUBLICATION_FAILED    => ['group' => 'publications', 'label' => 'Publication failed to publish'],
            self::APPROVAL_SUBMITTED    => ['group' => 'approvals',    'label' => 'Approval flow started'],
            self::APPROVAL_APPROVED     => ['group' => 'approvals',    'label' => 'Publication approved'],
            self::APPROVAL_REJECTED     => ['group' => 'approvals',    'label' => 'Publication rejected'],
            self::APPROVAL_CANCELLED    => ['group' => 'approvals',    'label' => 'Approval cancelled'],
            self::APPROVAL_AUTO_ADVANCED => ['group' => 'approvals',   'label' => 'Step auto-advanced (no approver)'],
            self::USER_CREATED          => ['group' => 'users',        'label' => 'User joined workspace'],
            self::USER_REMOVED          => ['group' => 'users',        'label' => 'User removed from workspace'],
            self::USER_ROLE_CHANGED     => ['group' => 'users',        'label' => 'User role changed'],
            self::ERROR_CRITICAL        => ['group' => 'system',       'label' => 'Critical error occurred'],
            self::SECURITY_EVENT        => ['group' => 'system',       'label' => 'Security event'],
        ];
    }

    public static function all(): array
    {
        return array_keys(self::definitions());
    }

    public static function groups(): array
    {
        $groups = [];
        foreach (self::definitions() as $key => $def) {
            $groups[$def['group']][] = ['key' => $key, 'label' => $def['label']];
        }
        return $groups;
    }
}
