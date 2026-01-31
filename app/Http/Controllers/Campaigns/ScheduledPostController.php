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
          'message' => 'Scheduled post not found'
        ], 404);
      }

      $post->delete();

      return response()->json([
        'success' => true,
        'message' => 'Scheduled post deleted successfully'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Error deleting scheduled post: ' . $e->getMessage()
      ], 500);
    }
  }
}
