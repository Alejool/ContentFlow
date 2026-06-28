<?php

namespace App\Constants;

/**
 * Canonical list of Sanctum token abilities used across the API.
 *
 * HOW TO ADD A NEW SCOPE:
 * 1. Add a constant here (e.g., MEDIA_DELETE = 'media:delete').
 * 2. Add it to the relevant $groups entry so the UI renders the checkbox.
 * 3. Apply \$request->user()->tokenCan(ApiScopes::YOUR_SCOPE) in any
 *    new controller, or add the scope to CheckTokenAbility::ROUTE_MAP
 *    so the middleware enforces it automatically on the route group.
 *
 * WILDCARD:
 * The special scope '*' grants all abilities — used by legacy tokens
 * and Enterprise programmatic tokens that need full access.
 */
class ApiScopes
{
    // ── Publications ─────────────────────────────────────────────────────────
    const PUBLICATIONS_READ   = 'publications:read';
    const PUBLICATIONS_CREATE = 'publications:create';
    const PUBLICATIONS_UPDATE = 'publications:update';
    const PUBLICATIONS_DELETE = 'publications:delete';
    const PUBLICATIONS_PUBLISH = 'publications:publish';

    // ── Campaigns ────────────────────────────────────────────────────────────
    const CAMPAIGNS_READ   = 'campaigns:read';
    const CAMPAIGNS_CREATE = 'campaigns:create';
    const CAMPAIGNS_UPDATE = 'campaigns:update';
    const CAMPAIGNS_DELETE = 'campaigns:delete';

    // ── Social Accounts ──────────────────────────────────────────────────────
    const SOCIAL_READ   = 'social:read';
    const SOCIAL_MANAGE = 'social:manage';

    // ── Calendar ─────────────────────────────────────────────────────────────
    const CALENDAR_READ   = 'calendar:read';
    const CALENDAR_MANAGE = 'calendar:manage';

    // ── Analytics ────────────────────────────────────────────────────────────
    const ANALYTICS_READ = 'analytics:read';

    // ── Approvals ────────────────────────────────────────────────────────────
    const APPROVALS_READ   = 'approvals:read';
    const APPROVALS_MANAGE = 'approvals:manage';

    // ── Media / Files ────────────────────────────────────────────────────────
    const MEDIA_READ   = 'media:read';
    const MEDIA_UPLOAD = 'media:upload';
    const MEDIA_DELETE = 'media:delete';

    // ── Workspace ────────────────────────────────────────────────────────────
    const WORKSPACE_READ   = 'workspace:read';
    const WORKSPACE_MANAGE = 'workspace:manage';

    // ── AI ───────────────────────────────────────────────────────────────────
    const AI_USE = 'ai:use';

    // ── Webhooks ─────────────────────────────────────────────────────────────
    const WEBHOOKS_READ   = 'webhooks:read';
    const WEBHOOKS_MANAGE = 'webhooks:manage';

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * All defined scopes grouped for the UI.
     *
     * Each group has:
     *   label   → Human-readable section name
     *   scopes  → [ scope_key => description ]
     */
    public static function groups(): array
    {
        return [
            'publications' => [
                'label' => 'Publications',
                'scopes' => [
                    self::PUBLICATIONS_READ    => 'List and view publications',
                    self::PUBLICATIONS_CREATE  => 'Create new publications',
                    self::PUBLICATIONS_UPDATE  => 'Edit existing publications',
                    self::PUBLICATIONS_DELETE  => 'Delete / cancel publications',
                    self::PUBLICATIONS_PUBLISH => 'Publish to social platforms',
                ],
            ],
            'campaigns' => [
                'label' => 'Campaigns',
                'scopes' => [
                    self::CAMPAIGNS_READ   => 'List and view campaigns',
                    self::CAMPAIGNS_CREATE => 'Create new campaigns',
                    self::CAMPAIGNS_UPDATE => 'Edit existing campaigns',
                    self::CAMPAIGNS_DELETE => 'Delete campaigns',
                ],
            ],
            'social' => [
                'label' => 'Social Accounts',
                'scopes' => [
                    self::SOCIAL_READ   => 'View connected social accounts',
                    self::SOCIAL_MANAGE => 'Connect / disconnect accounts',
                ],
            ],
            'calendar' => [
                'label' => 'Calendar',
                'scopes' => [
                    self::CALENDAR_READ   => 'View calendar events',
                    self::CALENDAR_MANAGE => 'Create and modify events',
                ],
            ],
            'analytics' => [
                'label' => 'Analytics',
                'scopes' => [
                    self::ANALYTICS_READ => 'Read analytics and reports',
                ],
            ],
            'approvals' => [
                'label' => 'Approvals',
                'scopes' => [
                    self::APPROVALS_READ   => 'View approval workflows and history',
                    self::APPROVALS_MANAGE => 'Approve, reject and manage workflows',
                ],
            ],
            'media' => [
                'label' => 'Media & Files',
                'scopes' => [
                    self::MEDIA_READ   => 'View uploaded media',
                    self::MEDIA_UPLOAD => 'Upload files',
                    self::MEDIA_DELETE => 'Delete media files',
                ],
            ],
            'workspace' => [
                'label' => 'Workspace',
                'scopes' => [
                    self::WORKSPACE_READ   => 'Read workspace info and members',
                    self::WORKSPACE_MANAGE => 'Manage members, roles and settings',
                ],
            ],
            'ai' => [
                'label' => 'AI Assistant',
                'scopes' => [
                    self::AI_USE => 'Use AI features (suggestions, chat)',
                ],
            ],
            'webhooks' => [
                'label' => 'Webhooks',
                'scopes' => [
                    self::WEBHOOKS_READ   => 'View webhook configurations',
                    self::WEBHOOKS_MANAGE => 'Create and modify webhooks',
                ],
            ],
        ];
    }

    /**
     * Flat list of all valid scope keys.
     * Use to validate incoming abilities arrays.
     */
    public static function all(): array
    {
        return array_merge(['*'], array_keys(self::flat()));
    }

    /**
     * Flat map of scope_key => description (no groups).
     */
    public static function flat(): array
    {
        return array_merge(...array_column(array_values(self::groups()), 'scopes'));
    }

    /**
     * Check whether a given ability string is valid.
     */
    public static function isValid(string $ability): bool
    {
        return in_array($ability, self::all(), true);
    }
}
