<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class YouTubeWebhookController extends Controller
{
    /**
     * Handle incoming YouTube push notifications (PubSubHubbub).
     */
    public function handle(Request $request)
    {
        // Challenge verification for PubSubHubbub
        if ($request->has('hub_challenge')) {
            Log::info('YouTube Webhook Verification', $request->all());
            return response($request->input('hub_challenge'), 200);
        }

        // Handle actual notification
        try {
            Log::info('YouTube Webhook Received', [
                'headers' => $request->headers->all(),
                'body' => $request->getContent()
            ]);

            // XML parsing logic would go here if using RSS/Atom feed updates
            // For now, we just log ensuring the endpoint exists and works.

            return response()->json(['status' => 'received'], 200);
        } catch (\Exception $e) {
            Log::error('YouTube Webhook Failed', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error'], 500);
        }
    }
}
