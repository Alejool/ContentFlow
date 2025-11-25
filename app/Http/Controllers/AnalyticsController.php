<?php

namespace App\Http\Controllers;

use App\Models\Analytics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AnalyticsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response {
        $user = Auth::user();
        
        // Fetch user's campaigns to show as "Top Content"
        // Assuming Campaign model is in App\Models\Campaigns\Campaign
        $topContent = \App\Models\Campaigns\Campaign::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function($campaign) {
                return [
                    'title' => $campaign->title,
                    'engagement' => rand(5, 15) . '.' . rand(0, 9) . '%', // Mock engagement
                ];
            });

        // Mock chart data
        $engagementData = [
            ['date' => 'Jan 1', 'engagement' => rand(30, 50) / 10],
            ['date' => 'Jan 5', 'engagement' => rand(40, 60) / 10],
            ['date' => 'Jan 10', 'engagement' => rand(35, 65) / 10],
            ['date' => 'Jan 15', 'engagement' => rand(50, 70) / 10],
            ['date' => 'Jan 20', 'engagement' => rand(60, 80) / 10],
            ['date' => 'Jan 25', 'engagement' => rand(70, 90) / 10],
            ['date' => 'Jan 30', 'engagement' => rand(75, 95) / 10],
            ['date' => 'Feb 5', 'engagement' => rand(80, 100) / 10],
            ['date' => 'Feb 10', 'engagement' => rand(75, 95) / 10],
            ['date' => 'Feb 15', 'engagement' => rand(85, 105) / 10],
            ['date' => 'Feb 20', 'engagement' => rand(90, 110) / 10],
            ['date' => 'Feb 25', 'engagement' => rand(85, 105) / 10],
            ['date' => 'Today', 'engagement' => rand(100, 120) / 10],
        ];

        return Inertia::render('Analytics/Index', [
            'topContent' => $topContent,
            'engagementData' => $engagementData
        ]);
    }
    

    /**  
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.    
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Analytics $analytics)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Analytics $analytics)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Analytics $analytics)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Analytics $analytics)
    {
        //
    }
}
