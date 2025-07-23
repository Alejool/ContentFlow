<?php

namespace App\Http\Controllers;

use App\Events\NewPost;
use App\Http\Requests\PostStoreRequest;
use App\Jobs\SyncMedia;
use App\Models\Post;
use App\Notification\ReviewNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;



class ManageContentController extends Controller
{
  public function index(Request $request): Response
  {
    return Inertia::render('Manage-content/Index', [
   
    ]);
  }  

  // public function store(PostStoreRequest $request): Response
  // {
  //   $post = Post::create($request->validated());

  //   Notification::send($post->author, new ReviewNotification($post));

  //   SyncMedia::dispatch($post);

  //   NewPost::dispatch($post);

  //   $request->session()->flash('post.title', $post->title);

  //   return redirect()->route('post.index');
  // }
}
