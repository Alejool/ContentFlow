<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessVideoJob;
use App\Models\VideoProcessingJob as VideoProcessingJobModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class VideoProcessingController extends Controller
{
  /**
   * Queue a video processing job
   *
   * @param Request $request
   * @return JsonResponse
   */
  public function process(Request $request): JsonResponse
  {
    $validator = Validator::make($request->all(), [
      'operation' => 'required|in:trim,merge,resize,watermark',
      'input_path' => 'required|string',
      'publication_id' => 'nullable|exists:publications,id',
      'parameters' => 'required|array',
      'parameters.segments' => 'required_if:operation,trim|array',
      'parameters.segments.*.start' => 'required_with:parameters.segments|numeric|min:0',
      'parameters.segments.*.end' => 'required_with:parameters.segments|numeric|min:0',
      'parameters.videos' => 'required_if:operation,merge|array',
      'parameters.width' => 'required_if:operation,resize|integer|min:1',
      'parameters.height' => 'required_if:operation,resize|integer|min:1',
      'parameters.watermark' => 'required_if:operation,watermark|string',
      'parameters.position' => 'nullable|in:top-left,top-right,bottom-left,bottom-right,center',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'message' => 'Validation failed',
        'errors' => $validator->errors(),
      ], 422);
    }

    $job = VideoProcessingJobModel::create([
      'user_id' => Auth::id(),
      'publication_id' => $request->publication_id,
      'operation' => $request->operation,
      'input_path' => $request->input_path,
      'parameters' => $request->parameters,
      'status' => 'pending',
    ]);

    // Dispatch job to queue
    ProcessVideoJob::dispatch($job->id);

    return response()->json([
      'message' => 'Video processing job queued successfully',
      'job' => [
        'id' => $job->id,
        'operation' => $job->operation,
        'status' => $job->status,
        'created_at' => $job->created_at,
      ],
    ], 202);
  }

  /**
   * Get processing job status
   *
   * @param int $jobId
   * @return JsonResponse
   */
  public function status(int $jobId): JsonResponse
  {
    $job = VideoProcessingJobModel::where('user_id', Auth::id())
      ->findOrFail($jobId);

    return response()->json([
      'job' => [
        'id' => $job->id,
        'operation' => $job->operation,
        'status' => $job->status,
        'progress' => $job->progress,
        'output_paths' => $job->output_paths,
        'error_message' => $job->error_message,
        'started_at' => $job->started_at,
        'completed_at' => $job->completed_at,
        'created_at' => $job->created_at,
      ],
    ]);
  }

  /**
   * Cancel a processing job
   *
   * @param int $jobId
   * @return JsonResponse
   */
  public function cancel(int $jobId): JsonResponse
  {
    $job = VideoProcessingJobModel::where('user_id', Auth::id())
      ->findOrFail($jobId);

    if ($job->status === 'completed' || $job->status === 'failed') {
      return response()->json([
        'message' => 'Cannot cancel a job that is already completed or failed',
      ], 400);
    }

    $job->update([
      'status' => 'failed',
      'error_message' => 'Cancelled by user',
      'completed_at' => now(),
    ]);

    return response()->json([
      'message' => 'Job cancelled successfully',
    ]);
  }

  /**
   * Get user's processing jobs
   *
   * @param Request $request
   * @return JsonResponse
   */
  public function index(Request $request): JsonResponse
  {
    $query = VideoProcessingJobModel::where('user_id', Auth::id());

    if ($request->has('status')) {
      $query->where('status', $request->status);
    }

    if ($request->has('publication_id')) {
      $query->where('publication_id', $request->publication_id);
    }

    $jobs = $query->orderBy('created_at', 'desc')
      ->paginate(20);

    return response()->json($jobs);
  }
}
