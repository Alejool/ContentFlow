<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Http\Requests\Publications\StoreHashtagLibraryRequest;
use App\Http\Requests\Publications\UpdateHashtagLibraryRequest;
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
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($hashtags);
    }

    public function store(StoreHashtagLibraryRequest $request)
    {
        $validated = $request->validated();

        $hashtag = HashtagLibrary::create([
            ...$validated,
            'workspace_id' => Auth::user()->current_workspace_id,
            'user_id' => Auth::id(),
        ]);

        return response()->json($hashtag, 201);
    }

    public function update(UpdateHashtagLibraryRequest $request, HashtagLibrary $hashtagLibrary)
    {
        $this->authorize('update', $hashtagLibrary);

        $validated = $request->validated();

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
