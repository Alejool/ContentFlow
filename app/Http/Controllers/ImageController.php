<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImageStoreRequest;
use App\Models\Image;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ImageController extends Controller
{
    public function index(Request $request): Response
    {
        $images = Image::all();

        return view('image.index', [
            'images' => $images,
        ]);
    }

    public function store(ImageStoreRequest $request): Response
    {
        $image = Image::create($request->validated());

        $request->session()->flash('success', $success);

        return redirect()->route('image.index');
    }
}
