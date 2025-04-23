<?php

namespace App\Http\Controllers\Campaigns;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Campaigns\Campaign;

class CampaignController extends Controller
{
    
    public function index()
    {
        // $campaigns = Campaign::all();
        // limit(10);
        $campaigns = Campaign::orderBy('id', 'asc')->get();
        $campaigns = Campaign::orderBy('id', 'asc')->take(5)->get();
        $campaigns = Campaign::orderBy('id', 'asc')->skip(5)->take(5)->get();
        
        // $campaigns = Campaign::paginate(10);

        return response()->json([
            'success' => true,
            // 'message' => '',
            'campaigns' => $campaigns,
            'status' => 200
        ]);


    }
    public function create()
    {
        return view('campaigns.create');
    }
    public function store(Request $request)
    {
        return response()->json([
            'message' => 'Campaign created successfully',
        ]);
    }

    public function show($id)
    {
        return view('campaigns.show');
    }

    public function edit($id)
    {
        return view('campaigns.edit');
    }

    public function update(Request $request, $id)
    {
        return response()->json([
            'message' => 'Campaign updated successfully',
        ]);
    }

}
