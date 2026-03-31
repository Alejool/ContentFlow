<?php

namespace App\Policies;

use App\Models\Publications\HashtagLibrary;
use App\Models\User;

class HashtagLibraryPolicy
{
    public function view(User $user, HashtagLibrary $hashtagLibrary): bool
    {
        return $user->current_workspace_id === $hashtagLibrary->workspace_id;
    }

    public function update(User $user, HashtagLibrary $hashtagLibrary): bool
    {
        return $user->current_workspace_id === $hashtagLibrary->workspace_id;
    }

    public function delete(User $user, HashtagLibrary $hashtagLibrary): bool
    {
        return $user->current_workspace_id === $hashtagLibrary->workspace_id;
    }
}
