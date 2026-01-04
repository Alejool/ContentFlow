<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('users.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('workspace.{workspaceId}', function ($user, $workspaceId) {
    return $user->workspaces()->where('workspaces.id', $workspaceId)->exists();
});

Broadcast::channel('publication.{id}', function ($user, $id) {
    // Check if user has access to the publication's workspace
    // This assumes you have a way to check access efficiently.
    // Ideally, load publication with workspace_id or check via relationship
    $publication = \App\Models\Publications\Publication::find($id);
    if (!$publication)
        return false;

    return $user->workspaces()->where('workspaces.id', $publication->workspace_id)->exists()
        ? ['id' => $user->id, 'name' => $user->name, 'avatar' => $user->profile_photo_url]
        : false;
});
