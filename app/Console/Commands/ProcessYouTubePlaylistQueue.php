<?php

namespace App\Console\Commands;

use App\Models\YouTubePlaylistQueue;
use App\Models\SocialAccount;
use App\Services\SocialPlatforms\YouTubeService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessYouTubePlaylistQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'youtube:process-playlist-queue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process pending YouTube playlist operations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Processing YouTube playlist queue...');

        // Obtener items pendientes o fallidos que pueden reintentar
        $pendingItems = YouTubePlaylistQueue::where('status', 'pending')
            ->orWhere(function ($q) {
                $q->where('status', 'failed')
                    ->where('retry_count', '<', 3)
                    ->where('last_attempt_at', '<', now()->subMinutes(30));
            })
            ->orderBy('created_at', 'asc')
            ->limit(50) // Procesar máximo 50 por ejecución
            ->get();

        if ($pendingItems->isEmpty()) {
            $this->info('No pending playlist operations found.');
            return 0;
        }

        $this->info("Found {$pendingItems->count()} items to process.");

        $processed = 0;
        $succeeded = 0;
        $failed = 0;

        foreach ($pendingItems as $item) {
            $processed++;
            $this->info("[{$processed}/{$pendingItems->count()}] Processing video {$item->video_id}...");

            if ($this->processPlaylistItem($item)) {
                $succeeded++;
            } else {
                $failed++;
            }
        }

        $this->info("Processing complete: {$succeeded} succeeded, {$failed} failed.");

        return 0;
    }

    /**
     * Process a single playlist queue item
     */
    private function processPlaylistItem(YouTubePlaylistQueue $item): bool
    {
        try {
            // Marcar como processing
            $item->markAsProcessing();

            // Obtener el social account del log
            $socialPostLog = $item->socialPostLog;
            if (!$socialPostLog) {
                throw new \Exception('Social post log not found');
            }

            $socialAccount = $socialPostLog->socialAccount;
            if (!$socialAccount || $socialAccount->platform !== 'youtube') {
                throw new \Exception('YouTube social account not found');
            }

            // Crear servicio de YouTube
            $youtubeService = new YouTubeService($socialAccount->access_token, $socialAccount);

            // PASO 1: Obtener o crear playlist
            $playlistId = $item->playlist_id;

            if (!$playlistId) {
                // Intentar buscar por nombre
                $playlistId = $youtubeService->findPlaylistByName($item->playlist_name);

                if (!$playlistId) {
                    // Crear nueva playlist
                    $campaign = $item->campaign;
                    $description = $campaign ? ($campaign->description ?? $item->playlist_name) : $item->playlist_name;

                    $playlistId = $youtubeService->createPlaylist(
                        $item->playlist_name,
                        $description,
                        'public'
                    );

                    if (!$playlistId) {
                        throw new \Exception("Failed to create playlist '{$item->playlist_name}'");
                    }

                    // Guardar playlist ID en la campaña
                    if ($campaign) {
                        $campaign->youtube_playlist_id = $playlistId;
                        $campaign->save();
                    }
                }

                // Actualizar el item con el playlist ID
                $item->playlist_id = $playlistId;
                $item->save();
            }

            // PASO 2: Agregar video a la playlist
            $success = $youtubeService->addVideoToPlaylist($playlistId, $item->video_id);

            if (!$success) {
                throw new \Exception('Failed to add video to playlist');
            }

            // Marcar como completado
            $item->markAsCompleted();

            Log::info('Playlist operation completed', [
                'video_id' => $item->video_id,
                'playlist_id' => $playlistId,
                'playlist_name' => $item->playlist_name
            ]);

            $this->line("  ✓ Video {$item->video_id} added to playlist '{$item->playlist_name}'");

            return true;
        } catch (\Exception $e) {
            // Marcar como fallido
            $item->markAsFailed($e->getMessage());

            Log::error('Playlist operation failed', [
                'video_id' => $item->video_id,
                'playlist_name' => $item->playlist_name,
                'error' => $e->getMessage(),
                'retry_count' => $item->retry_count
            ]);

            $this->error("  ✗ Failed: {$e->getMessage()}");

            if ($item->retry_count >= 3) {
                $this->warn("  ⚠ Max retries reached for video {$item->video_id}");
            }

            return false;
        }
    }
}
