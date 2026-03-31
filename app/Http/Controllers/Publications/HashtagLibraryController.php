<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Models\Publications\HashtagLibrary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HashtagLibraryController extends Controller
{
    public function index(Request $request)
    {
        $query = HashtagLibrary::where('workspace_id', Auth::user()->current_workspace_id);

        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        if ($request->boolean('favorites')) {
            $query->favorites();
        }

        $hashtags = $query->orderBy('usage_count', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($hashtags);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'hashtags' => 'required|array',
            'hashtags.*' => 'string',
            'category' => 'nullable|string|max:100',
            'is_favorite' => 'boolean',
        ]);

        $hashtag = HashtagLibrary::create([
            ...$validated,
            'workspace_id' => Auth::user()->current_workspace_id,
            'user_id' => Auth::id(),
        ]);

        return response()->json($hashtag, 201);
    }

    public function update(Request $request, HashtagLibrary $hashtagLibrary)
    {
        $this->authorize('update', $hashtagLibrary);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'hashtags' => 'array',
            'hashtags.*' => 'string',
            'category' => 'nullable|string|max:100',
            'is_favorite' => 'boolean',
        ]);

        $hashtagLibrary->update($validated);

        return response()->json($hashtagLibrary);
    }

    public function destroy(HashtagLibrary $hashtagLibrary)
    {
        $this->authorize('delete', $hashtagLibrary);

        $hashtagLibrary->delete();

        return response()->json(null, 204);
    }

    public function use(HashtagLibrary $hashtagLibrary)
    {
        $this->authorize('view', $hashtagLibrary);

        $hashtagLibrary->incrementUsage();

        return response()->json([
            'hashtags' => $hashtagLibrary->hashtags,
            'usage_count' => $hashtagLibrary->usage_count,
        ]);
    }
}
