<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationsController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->notifications();

        // Filter by category
        if ($request->has('category')) {
            $query->whereJsonContains('data->category', $request->category);
        }

        // Filter by platform
        if ($request->has('platform')) {
            $query->whereJsonContains('data->platform', $request->platform);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->whereJsonContains('data->priority', $request->priority);
        }

        // Filter by read status
        if ($request->has('unread_only') && $request->unread_only) {
            $query->whereNull('read_at');
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereJsonContains('data->title', $search)
                    ->orWhereJsonContains('data->message', $search);
            });
        }

        $notifications = $query->latest()->paginate($request->per_page ?? 100);

        return response()->json([
            'notifications' => $notifications->items(),
            'unread_count' => Auth::user()->unreadNotifications->count(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    public function markAsRead($id)
    {
        $notification = Auth::user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }
        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        $notification = Auth::user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->delete();
        }
        return response()->json(['success' => true]);
    }

    public function destroyRead()
    {
        Auth::user()->readNotifications()->delete();
        return response()->json(['success' => true]);
    }

    public function stats()
    {
        $user = Auth::user();

        return response()->json([
            'total' => $user->notifications()->count(),
            'unread' => $user->unreadNotifications->count(),
            'by_category' => [
                'application' => $user->notifications()
                    ->whereJsonContains('data->category', 'application')
                    ->count(),
                'system' => $user->notifications()
                    ->whereJsonContains('data->category', 'system')
                    ->count(),
            ],
            'by_priority' => [
                'critical' => $user->notifications()
                    ->whereJsonContains('data->priority', 'critical')
                    ->count(),
                'high' => $user->notifications()
                    ->whereJsonContains('data->priority', 'high')
                    ->count(),
                'normal' => $user->notifications()
                    ->whereJsonContains('data->priority', 'normal')
                    ->count(),
                'low' => $user->notifications()
                    ->whereJsonContains('data->priority', 'low')
                    ->count(),
            ],
        ]);
    }
}
