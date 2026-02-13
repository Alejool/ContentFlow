<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Publications\Publication;

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
    $publication = Publication::find($id);
    if (!$publication)
        return false;

    return $user->workspaces()->where('workspaces.id', $publication->workspace_id)->exists()
        ? ['id' => $user->id, 'name' => $user->name, 'avatar' => $user->photo_url]
        : false;
});
