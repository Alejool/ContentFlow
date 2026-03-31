<?php

namespace App\Integrations\RSS;

use App\Integrations\Core\BaseIntegration;
use App\Integrations\Contracts\SyncableInterface;
use App\Models\Integration;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class RSSFeedService extends BaseIntegration implements SyncableInterface
{
    protected string $name = 'RSS Feed';
    protected string $type = 'rss';
    
    protected array $configSchema = [
        'feed_url' => [
            'type' => 'url',
            'required' => true,
            'label' => 'Feed URL',
        ],
        'auto_import' => [
            'type' => 'boolean',
            'required' => false,
            'default' => true,
            'label' => 'Auto Import',
        ],
        'import_frequency' => [
            'type' => 'select',
            'required' => false,
            'default' => 'hourly',
            'options' => ['hourly', 'daily', 'weekly'],
            'label' => 'Import Frequency',
        ],
    ];

    public function testConnection(Integration $integration): bool
    {
        $feedUrl = $integration->config['feed_url'] ?? null;
        
        if (!$feedUrl) {
            return false;
        }

        try {
            $response = Http::timeout(10)->get($feedUrl);
            return $response->successful() && $this->isValidRSSFeed($response->body());
        } catch (\Exception $e) {
            $this->log($integration, 'test_connection', [], $e->getMessage());
            return false;
        }
    }

    public function sync(Integration $integration): Collection
    {
        $feedUrl = $integration->config['feed_url'] ?? null;
        
        if (!$feedUrl) {
            throw new \InvalidArgumentException('Feed URL is required');
        }

        try {
            $parser = new RSSParser();
            $items = $parser->parse($feedUrl);
            
            $importer = new RSSImporter();
            $publications = $importer->import($integration, $items);
            
            $integration->updateLastSync();
            $this->log($integration, 'sync', [
                'items_count' => $items->count(),
                'publications_created' => $publications->count(),
            ]);
            
            return $publications;
        } catch (\Exception $e) {
            $this->log($integration, 'sync', [], $e->getMessage());
            throw $e;
        }
    }

    public function getLastSyncAt(Integration $integration): ?string
    {
        return $integration->last_sync_at?->toIso8601String();
    }

    public function needsSync(Integration $integration): bool
    {
        if (!$integration->isActive()) {
            return false;
        }

        $frequency = $integration->config['import_frequency'] ?? 'hourly';
        $lastSync = $integration->last_sync_at;

        if (!$lastSync) {
            return true;
        }

        return match ($frequency) {
            'hourly' => $lastSync->addHour()->isPast(),
            'daily' => $lastSync->addDay()->isPast(),
            'weekly' => $lastSync->addWeek()->isPast(),
            default => false,
        };
    }

    protected function isValidRSSFeed(string $content): bool
    {
        return str_contains($content, '<rss') || str_contains($content, '<feed');
    }
}
