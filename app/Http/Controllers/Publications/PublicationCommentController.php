<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PublicationCommentController extends Controller
{
    public function index(Publication $publication)
    {
        return response()->json(
            $publication->comments()
                ->with('user:id,name,photo_url')
                ->get()
        );
    }

    public function store(Request $request, Publication $publication)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment = $publication->comments()->create([
            'user_id' => Auth::id(),
            'content' => $validated['content'],
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
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->noContent();
    }
}
