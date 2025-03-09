<?php

namespace App\Http\Controllers;

use App\Models\Ai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AIChatController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('AIChat/Index', []);
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
    public function show(Ai $ai)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ai $ai)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ai $ai)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ai $ai)
    {
        //
    }
}
