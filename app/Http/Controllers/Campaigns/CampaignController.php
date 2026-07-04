<?php

namespace App\Http\Controllers\Campaigns;

use App\DTOs\Campaign\CreateCampaignDTO;
use App\DTOs\Campaign\UpdateCampaignDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Campaigns\CampaignPublicationsRequest;
use App\Http\Requests\Campaigns\StoreCampaignRequest;
use App\Http\Requests\Campaigns\UpdateCampaignRequest;
use App\Services\Campaign\CampaignCrudService;
use App\Services\Statistics\StatisticsService;
use App\Traits\System\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;

class CampaignController extends Controller
{
  use ApiResponse;

  public function __construct(
    private StatisticsService $statisticsService,
    private CampaignCrudService $campaignService,
  ) {
  }

  /**
   * Display a listing of campaigns (grouping of publications)
   */
  public function index(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    $performanceData = $this->statisticsService->getTopCampaigns($workspaceId, 100);
    $cacheVersion = cache()->get("campaigns:{$workspaceId}:version", 1);

    $cacheKey = sprintf(
      'campaigns:%d:v%d:%s:%d',
      $workspaceId,
      $cacheVersion,
      md5(json_encode($request->all())),
      $request->query('page', 1)
    );

    $campaigns = cache()->remember(
      $cacheKey,
      10,
      fn () => $this->campaignService->listWithStats(
        $workspaceId,
        $request->only(['status', 'search', 'date_start', 'date_end']),
        (int) $request->query('per_page', 12),
      ),
    );

    return $this->successResponse([
      'campaigns' => $campaigns,
      'performanceData' => $performanceData
    ]);
  }

  /**
   * Store a new campaign
   */
  public function store(StoreCampaignRequest $request)
  {
    $campaign = $this->campaignService->create(
      CreateCampaignDTO::fromRequest($request),
      Auth::user()->current_workspace_id,
    );

    return $this->successResponse(['campaign' => $campaign], 'Campaign created successfully', 201);
  }

  /**
   * Display the specified campaign
   */
  public function show(Request $request, $id)
  {
    $campaign = $this->campaignService->find($id, Auth::user()->current_workspace_id);

    return $this->successResponse(['campaign' => $campaign]);
  }

  /**
   * Update the specified campaign
   */
  public function update(UpdateCampaignRequest $request, $id)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    $campaign = $this->campaignService->findScoped($id, $workspaceId);

    $result = $this->campaignService->update($campaign, UpdateCampaignDTO::fromRequest($request), $workspaceId);

    if (!$result['ok']) {
      return response()->json([
        'success' => false,
        'message' => $result['error'],
        'errors' => ['name' => [$result['error']]],
      ], 422);
    }

    return $this->successResponse(['campaign' => $result['campaign']], 'Campaign updated successfully');
  }

  /**
   * Remove the specified campaign
   */
  public function destroy($id)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    $campaign = $this->campaignService->findScoped($id, $workspaceId);
    $this->campaignService->delete($campaign, $workspaceId);

    return $this->successResponse(null, 'Campaign deleted successfully');
  }

  /**
   * Duplicate the specified campaign
   */
  public function duplicate($id)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    $campaign = $this->campaignService->findScoped($id, $workspaceId);
    $copy = $this->campaignService->duplicate($campaign, $workspaceId);

    return $this->successResponse(['campaign' => $copy], 'Campaign duplicated successfully', 201);
  }

  /**
   * Add publications to a campaign
   */
  public function addPublications(CampaignPublicationsRequest $request, $id)
  {
    $campaign = $this->campaignService->findScoped($id, Auth::user()->current_workspace_id);
    $campaign = $this->campaignService->addPublications($campaign, $request->validated()['publication_ids']);

    return $this->successResponse(['campaign' => $campaign], 'Publications added to campaign');
  }

  /**
   * Remove publications from a campaign
   */
  public function removePublications(CampaignPublicationsRequest $request, $id)
  {
    $campaign = $this->campaignService->findScoped($id, Auth::user()->current_workspace_id);
    $campaign = $this->campaignService->removePublications($campaign, $request->validated()['publication_ids']);

    return $this->successResponse(['campaign' => $campaign], 'Publications removed from campaign');
  }

  public function export(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    $format = $request->input('format', 'xlsx');
    $filters = $request->only(['status', 'search', 'date_start', 'date_end']);

    try {
      // Get workspace and history limit info
      $workspace = Auth::user()->currentWorkspace ?? Auth::user()->workspaces()->first();
      $validator = app(\App\Services\Subscription\GranularLimitValidator::class);
      $historyDays = $validator->getHistoryDaysLimit($workspace);
      $startDate = $validator->getExportStartDate($workspace);
      $endDate = now();
      
      $export = new \App\Exports\Social\CampaignsExport($filters);
      
      // Generate descriptive filename with date range and plan limit
      $startDateStr = $startDate->format('Y-m-d');
      $endDateStr = $endDate->format('Y-m-d');
      $filename = "campañas_{$startDateStr}_{$endDateStr}_{$historyDays}dias.{$format}";

      if ($format === 'csv' || $format === 'xlsx') {
        $response = Excel::download($export, $filename);
        
        // Add custom header with export info
        $response->headers->set('X-Export-History-Days', $historyDays);
        $response->headers->set('X-Export-Start-Date', $startDate->format('Y-m-d'));
        
        return $response;
      }

      if ($format === 'pdf') {
        return Excel::download($export, $filename, \Maatwebsite\Excel\Excel::DOMPDF);
      }

      return Excel::download($export, $filename);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => __('messages.campaign.export_failed', ['error' => $e->getMessage()])
      ], 500);
    }
  }
}
