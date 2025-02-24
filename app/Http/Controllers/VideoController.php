<?php

namespace App\Http\Controllers;

use App\Http\Requests\VideoStoreRequest;
use App\Models\Video;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class VideoController extends Controller
{
    public function index(Request $request): Response
    {
        $videos = Video::all();

        return view('video.index', [
            'videos' => $videos,
        ]);
    }

    public function store(VideoStoreRequest $request): Response
    {
        $video = Video::create($request->validated());

        $request->session()->flash('video.url', $video->url);

        return redirect()->route('video.index');
    }
}
