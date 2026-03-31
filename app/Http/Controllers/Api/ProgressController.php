<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaFiles\MediaFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProgressController extends Controller
{
    /**
     * Get upload progress for multiple uploads
     */
    public function getUploadProgress(Request $request)
    {
        $request->validate([
            'upload_ids' => 'required|string',
        ]);

        $uploadIds = explode(',', $request->input('upload_ids'));
        $uploads = [];

        foreach ($uploadIds as $uploadId) {
            $uploadId = trim($uploadId);
            
            // Try to get progress from cache first
            $cacheKey = "upload_progress_{$uploadId}";
            $progress = Cache::get($cacheKey);
            
            if ($progress) {
                $uploads[$uploadId] = $progress;
            } else {
                // Try to find associated media file
                // Only search by ID if uploadId is numeric, otherwise search by file_path
                $mediaFile = null;
                
                if (is_numeric($uploadId)) {
                    $mediaFile = MediaFile::where('id', $uploadId)->first();
                }
                
                // If not found by ID or uploadId is not numeric, search by file_path
                if (!$mediaFile) {
                    $mediaFile = MediaFile::where('file_path', 'like', "%{$uploadId}%")->first();
                }
                
                if ($mediaFile) {
                    $uploads[$uploadId] = [
                        'progress' => $mediaFile->status === 'completed' ? 100 : 
                                    ($mediaFile->status === 'failed' ? 0 : 50),
                        'status' => $mediaFile->status,
                        's3_key' => $mediaFile->file_path,
                        'error' => $mediaFile->status === 'failed' ? 
                                 ($mediaFile->metadata['error'] ?? 'Upload failed') : null,
                    ];
                } else {
                    // Upload not found, might be completed or failed
                    $uploads[$uploadId] = [
                        'progress' => 0,
                        'status' => 'not_found',
                        'error' => 'Upload not found',
                    ];
                }
            }
        }

        return response()->json([
            'uploads' => $uploads,
        ]);
    }

    /**
     * Get processing progress for multiple jobs
     */
    public function getProcessingProgress(Request $request)
    {
        $request->validate([
            'job_ids' => 'required|string',
        ]);

        $jobIds = explode(',', $request->input('job_ids'));
        $jobs = [];

        foreach ($jobIds as $jobId) {
            $jobId = trim($jobId);
            
            // Try to get progress from cache
            $cacheKey = "processing_progress_{$jobId}";
            $progress = Cache::get($cacheKey);
            
            if ($progress) {
                $jobs[$jobId] = $progress;
            } else {
                // Extract media file ID from job ID if it follows pattern "media_processing_{id}"
                if (preg_match('/media_processing_(\d+)/', $jobId, $matches)) {
                    $mediaFileId = $matches[1];
                    $mediaFile = MediaFile::find($mediaFileId);
                    
                    if ($mediaFile) {
                        $jobs[$jobId] = [
                            'progress' => $mediaFile->status === 'completed' ? 100 : 
                                        ($mediaFile->status === 'failed' ? 0 : 50),
                            'status' => $mediaFile->status,
                            'current_step' => $mediaFile->status === 'processing' ? 'Processing media...' : '',
                            'error' => $mediaFile->status === 'failed' ? 
                                     ($mediaFile->metadata['error'] ?? 'Processing failed') : null,
                        ];
                    } else {
                        $jobs[$jobId] = [
                            'progress' => 100,
                            'status' => 'completed',
                        ];
                    }
                } else {
                    // Job not found or completed
                    $jobs[$jobId] = [
                        'progress' => 100,
                        'status' => 'completed',
                    ];
                }
            }
        }

        return response()->json([
            'jobs' => $jobs,
        ]);
    }

    /**
     * Update upload progress (called by upload process)
     */
    public function updateUploadProgress(Request $request)
    {
        $request->validate([
            'upload_id' => 'required|string',
            'progress' => 'required|integer|min:0|max:100',
            'bytes_uploaded' => 'nullable|integer|min:0',
            'speed' => 'nullable|numeric|min:0',
            'eta' => 'nullable|integer|min:0',
        ]);

        $uploadId = $request->input('upload_id');
        $progress = $request->input('progress');
        
        $progressData = [
            'progress' => $progress,
            'bytes_uploaded' => $request->input('bytes_uploaded', 0),
            'speed' => $request->input('speed', 0),
            'eta' => $request->input('eta', 0),
            'updated_at' => now()->toISOString(),
        ];

        // Store in cache for 5 minutes
        $cacheKey = "upload_progress_{$uploadId}";
        Cache::put($cacheKey, $progressData, 300);

        // Broadcast via WebSocket if available
        try {
            broadcast(new \App\Events\UploadProgressUpdated(
                $request->user()->id,
                $uploadId,
                $progressData
            ));
        } catch (\Exception $e) {
            Log::warning('Failed to broadcast upload progress', [
                'error' => $e->getMessage(),
                'upload_id' => $uploadId,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Update processing progress (called by jobs)
     */
    public function updateProcessingProgress(Request $request)
    {
        $request->validate([
            'job_id' => 'required|string',
            'progress' => 'required|integer|min:0|max:100',
            'current_step' => 'nullable|string',
            'total_steps' => 'nullable|integer|min:0',
            'completed_steps' => 'nullable|integer|min:0',
            'eta' => 'nullable|integer|min:0',
        ]);

        $jobId = $request->input('job_id');
        $progress = $request->input('progress');
        
        $progressData = [
            'progress' => $progress,
            'current_step' => $request->input('current_step', ''),
            'total_steps' => $request->input('total_steps', 0),
            'completed_steps' => $request->input('completed_steps', 0),
            'eta' => $request->input('eta', 0),
            'updated_at' => now()->toISOString(),
        ];

        // Store in cache for 10 minutes
        $cacheKey = "processing_progress_{$jobId}";
        Cache::put($cacheKey, $progressData, 600);

        return response()->json(['success' => true]);
    }
}