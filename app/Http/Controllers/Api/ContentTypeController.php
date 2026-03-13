<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Publications\ContentTypeValidationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContentTypeController extends Controller
{
    public function __construct(
        private ContentTypeValidationService $validationService
    ) {}

    /**
     * Suggest optimal content type based on media file
     */
    public function suggestType(Request $request): JsonResponse
    {
        $request->validate([
            'duration' => 'nullable|numeric|min:0',
            'mime_type' => 'required|string',
            'current_type' => 'required|string|in:post,reel,story,carousel,poll'
        ]);

        $mediaFile = [
            'duration' => $request->duration,
            'mime_type' => $request->mime_type,
            'type' => $request->mime_type
        ];

        $currentType = $request->current_type;
        $suggestedType = $this->validationService->suggestContentTypeByDuration($mediaFile, $currentType);

        $response = [
            'current_type' => $currentType,
            'suggested_type' => $suggestedType,
            'should_change' => $suggestedType !== $currentType,
            'reason' => null
        ];

        if ($response['should_change']) {
            $response['reason'] = $this->getChangeReason($currentType, $suggestedType, $request->duration);
        }

        return response()->json($response);
    }

    /**
     * Get reason for content type change
     */
    private function getChangeReason(string $currentType, string $suggestedType, ?float $duration): string
    {
        if ($duration === null) {
            return "Video duration will be analyzed to suggest optimal content type";
        }
        
        $durationText = gmdate("i:s", $duration);
        
        if ($suggestedType === 'post') {
            return "Video duration ({$durationText}) exceeds limits for {$currentType}. Suggested: Post (no duration limit)";
        } elseif ($suggestedType === 'reel') {
            return "Video duration ({$durationText}) is optimal for Reel format (15-90 seconds)";
        } elseif ($suggestedType === 'story') {
            return "Video duration ({$durationText}) is suitable for Story format (1-60 seconds)";
        }
        
        return "Content type adjusted based on video duration ({$durationText})";
    }
}