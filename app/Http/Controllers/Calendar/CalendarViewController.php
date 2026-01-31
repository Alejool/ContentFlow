<?php

namespace App\Http\Controllers\Calendar;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class CalendarViewController extends Controller
{
    public function index()
    {
        return Inertia::render('Calendar/Index');
    }
}
