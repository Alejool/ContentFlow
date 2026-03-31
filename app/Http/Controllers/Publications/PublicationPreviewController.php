<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Services\Preview\PlatformPreviewService;
use Illuminate\Http\Request;

class PublicationPreviewController extends Controller
{
    public function show(Publication $publication, Request $request, PlatformPreviewService $previewService)
    {
        $platform = $request->input('platform', 'generic');
        
        $preview = $previewService->generatePreview($publication, $platform);

        return response()->json($preview);
    }

    public function multiPlatform(Publication $publication, PlatformPreviewService $previewService)
    {
        $platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'];
        
        $previews = [];
        foreach ($platforms as $platform) {
            $previews[$platform] = $previewService->generatePreview($publication, $platform);
        }

        return response()->json($previews);
    }
}
