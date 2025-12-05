<?php

namespace App\Http\Controllers\ManageContent;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\Controller;



class ManageContentController extends Controller
{
  public function index(Request $request): Response
  {
    return Inertia::render('Manage-content/Index', [
   
    ]);
  }  

}
