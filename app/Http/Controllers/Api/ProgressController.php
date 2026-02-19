<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProgressController extends Controller
{
    /**
     * Get current progress for uploads and processing jobs
     * 
     * This endpoint allows polling for progress updates when WebSockets are unavailable.
     * It fetches progress data from Redis cache for multiple uploads and/or processing jobs.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'upload_ids' => 'nullable|array',
            'upload_ids.*' => 'string',
            'job_ids' => 'nullable|array',
            'job_ids.*' => 'string',
        ]);

        $uploadProgress = [];
        $jobProgress = [];

        // Fetch upload progress
        if (!empty($validated['upload_ids'])) {
            foreach ($validated['upload_ids'] as $uploadId) {
                $progress = Cache::get("upload_progress:{$uploadId}");
                if ($progress) {
                    $uploadProgress[$uploadId] = $progress;
                }
            }
        }

        // Fetch job progress
        if (!empty($validated['job_ids'])) {
            foreach ($validated['job_ids'] as $jobId) {
                $progress = Cache::get("processing_progress:{$jobId}");
                if ($progress) {
                    $jobProgress[$jobId] = $progress;
                }
            }
        }

        return response()->json([
            'uploads' => $uploadProgress,
            'jobs' => $jobProgress,
        ]);
    }
}
