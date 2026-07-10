<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use App\Http\Requests\Publications\StoreCommentRequest;
class PublicationCommentController extends Controller
{
    public function index(Publication $publication)
    {
        return response()->json(
            $publication->comments()
                ->whereNull('parent_id')
                ->with(['user:id,name,photo_url', 'replies.user:id,name,photo_url'])
                ->latest()
                ->get()
        );
    }

    public function store(StoreCommentRequest $request, Publication $publication)
    {
        $validated = $request->validated();

        $comment = $publication->comments()->create([
            'user_id' => Auth::id(),
            'content' => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        return response()->json(
            $comment->load('user:id,name,photo_url'),
            201
        );
    }

    public function destroy(Publication $publication, PublicationComment $comment)
    {
        if (Auth::id() !== $comment->user_id) {
            // Optional: check for admin/manager role
            // if (!Auth::user()->can('manage-comments')) { ... }
            return response()->json(['message' => __('messages.comment.unauthorized')], 403);
        }

        $comment->delete();

        return response()->noContent();
    }
}
