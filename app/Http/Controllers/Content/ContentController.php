<?php

namespace App\Http\Controllers\Content;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Controller;



class ContentController extends Controller
{
  public function index(Request $request): Response
  {
    return Inertia::render('Content/Index', []);
  }
}
