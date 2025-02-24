<?php

namespace App\Http\Controllers;

use App\Http\Requests\CollectionAttachImageRequest;
use App\Http\Requests\CollectionStoreRequest;
use App\Models\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CollectionController extends Controller
{
    public function index(Request $request): Response
    {
        $collections = Collection::all();

        return view('collection.index', [
            'collections' => $collections,
        ]);
    }

    public function store(CollectionStoreRequest $request): Response
    {
        $collection = Collection::create($request->validated());

        $request->session()->flash('success', $success);

        return redirect()->route('collection.index');
    }

    public function attachImage(CollectionAttachImageRequest $request): Response
    {
        $collection.images().attach(imageId)->save();

        $request->session()->flash('success', $success);

        return redirect()->route('collection.show', ['collection' => $collection]);
    }
}
