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
        return Inertia::render('Analytics/Index', []);
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
