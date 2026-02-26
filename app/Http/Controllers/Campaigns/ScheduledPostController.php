<?php

namespace App\Http\Controllers\Campaigns;

use App\Http\Controllers\Controller;
use App\Models\Social\ScheduledPost;
use Illuminate\Support\Facades\Auth;

class ScheduledPostController extends Controller
{
  public function destroy($id)
  {
    try {
      $post = ScheduledPost::where('id', $id)
        ->where('user_id', Auth::id())
        ->first();

      if (!$post) {
        return response()->json([
          'success' => false,
          'message' => __('messages.scheduled_post.not_found')
        ], 404);
      }

      $post->delete();

      return response()->json([
        'success' => true,
        'message' => __('messages.scheduled_post.deleted')
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => __('messages.scheduled_post.delete_error', ['error' => $e->getMessage()])
      ], 500);
    }
  }
}
