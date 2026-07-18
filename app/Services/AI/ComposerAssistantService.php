<?php

namespace App\Services\AI;

use App\Models\Social\SocialPostLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Generates the QuickComposer guidance: the best time to publish based on the
 * workspace's real posting history, plus a short tip and an interaction nudge.
 * Uses the LLM (OpenRouter preferred) for the copy; falls back to a pure
 * heuristic when no AI provider is available so the strip always renders.
 */
class ComposerAssistantService
{
  /** Fallback peak hours per platform when the workspace has no history yet. */
  private const PLATFORM_PEAK_HOURS = [
    'instagram' => 18,
    'facebook' => 13,
    'twitter' => 9,
    'linkedin' => 8,
    'tiktok' => 19,
    'youtube' => 17,
    'threads' => 18,
  ];

  public function __construct(private AIService $ai)
  {
  }

  public function suggest(
    int $workspaceId,
    array $platforms,
    ?string $draft,
    string $timezone = 'America/Bogota',
    string $locale = 'es',
  ): array {
    $stats = $this->historyStats($workspaceId);
    $suggestedTime = $this->nextOccurrence(
      $this->bestHour($stats['by_hour'], $platforms),
      $timezone,
    );

    $heuristic = $this->heuristicCopy($suggestedTime, $stats, $locale);

    try {
      $response = $this->ai->chat([
        'type' => 'composer_assistant',
        'message' => $this->buildPrompt($stats, $platforms, $draft, $suggestedTime, $timezone, $locale),
      ], 'openrouter');

      $data = $response['suggestion']['data'] ?? [];
      if (!empty($data['headline']) && !empty($data['cta'])) {
        return [
          'headline' => $data['headline'],
          'tip' => $data['tip'] ?? $heuristic['tip'],
          'cta' => $data['cta'],
          'suggested_time' => $this->sanitizeTime($data['suggested_time'] ?? null, $timezone)
            ?? $suggestedTime->toIso8601String(),
          'source' => 'ai',
        ];
      }
    } catch (\Throwable $e) {
      Log::warning('ComposerAssistant: AI unavailable, using heuristic', ['error' => $e->getMessage()]);
    }

    return $heuristic + [
      'suggested_time' => $suggestedTime->toIso8601String(),
      'source' => 'heuristic',
    ];
  }

  /** Hour/weekday histograms of successfully published posts, last 90 days. */
  private function historyStats(int $workspaceId): array
  {
    $rows = SocialPostLog::query()
      ->where('status', 'published')
      ->whereNotNull('published_at')
      ->where('published_at', '>=', now()->subDays(90))
      ->whereHas('publication', fn ($q) => $q->where('workspace_id', $workspaceId))
      ->get(['published_at', 'platform']);

    $byHour = [];
    $byWeekday = [];
    foreach ($rows as $row) {
      $at = Carbon::parse($row->published_at);
      $byHour[$at->hour] = ($byHour[$at->hour] ?? 0) + 1;
      $byWeekday[$at->dayOfWeekIso] = ($byWeekday[$at->dayOfWeekIso] ?? 0) + 1;
    }

    return ['total' => $rows->count(), 'by_hour' => $byHour, 'by_weekday' => $byWeekday];
  }

  private function bestHour(array $byHour, array $platforms): int
  {
    if (!empty($byHour)) {
      arsort($byHour);
      return (int) array_key_first($byHour);
    }

    foreach ($platforms as $platform) {
      $key = strtolower((string) $platform);
      if (isset(self::PLATFORM_PEAK_HOURS[$key])) {
        return self::PLATFORM_PEAK_HOURS[$key];
      }
    }

    return 18;
  }

  private function nextOccurrence(int $hour, string $timezone): Carbon
  {
    $now = Carbon::now($timezone);
    $candidate = $now->copy()->setTime($hour, 0);
    // Too close or already gone: suggest tomorrow's slot instead.
    if ($candidate->lte($now->copy()->addMinutes(15))) {
      $candidate->addDay();
    }

    return $candidate;
  }

  private function sanitizeTime(?string $iso, string $timezone): ?string
  {
    if (!$iso) {
      return null;
    }
    try {
      $time = Carbon::parse($iso, $timezone);

      return $time->isFuture() ? $time->toIso8601String() : null;
    } catch (\Throwable) {
      return null;
    }
  }

  private function heuristicCopy(Carbon $suggestedTime, array $stats, string $locale): array
  {
    $day = $suggestedTime->locale($locale)->isoFormat('dddd');
    $hour = $suggestedTime->format('H:i');

    if ($locale === 'en') {
      return [
        'headline' => $stats['total'] > 0
          ? "Your audience responds best around {$hour} — {$day} looks great."
          : "A strong slot to start: {$day} at {$hour}.",
        'tip' => 'Posts with a question in the first line get more replies.',
        'cta' => "Schedule it for {$hour}?",
      ];
    }

    return [
      'headline' => $stats['total'] > 0
        ? "Tu audiencia responde mejor cerca de las {$hour} — el {$day} pinta bien."
        : "Buen horario para empezar: {$day} a las {$hour}.",
      'tip' => 'Los posts que abren con una pregunta reciben más respuestas.',
      'cta' => "¿La programamos para las {$hour}?",
    ];
  }

  private function buildPrompt(
    array $stats,
    array $platforms,
    ?string $draft,
    Carbon $suggestedTime,
    string $timezone,
    string $locale,
  ): string {
    $language = $locale === 'en' ? 'English' : 'Spanish';
    $platformsList = implode(', ', array_map('strval', $platforms)) ?: 'none selected';
    $historyLine = $stats['total'] > 0
      ? 'Publishing-hour histogram (hour => published posts, last 90 days): ' . json_encode($stats['by_hour'])
        . ' | weekday histogram (1=Mon): ' . json_encode($stats['by_weekday'])
      : 'No publishing history yet for this workspace.';
    $draftExcerpt = $draft ? mb_substr($draft, 0, 400) : '';
    $nowLocal = Carbon::now($timezone)->toDayDateTimeString();
    $defaultIso = $suggestedTime->toIso8601String();

    return "You are the publishing coach inside a social media scheduler's quick composer.\n"
      . "Respond with JSON ONLY, exactly this shape:\n"
      . '{"suggestion":{"type":"composer_assistant","data":{"headline":"...","tip":"...","cta":"...","suggested_time":"ISO8601"}}}' . "\n\n"
      . "Rules:\n"
      . "- Write headline/tip/cta in {$language}. Friendly, concrete, max ~90 chars each.\n"
      . "- headline: recommend the best moment to publish (mention day/hour naturally).\n"
      . "- tip: one actionable improvement for engagement (base it on the draft when given).\n"
      . "- cta: a short question inviting the user to act right now (schedule/publish/refine).\n"
      . "- suggested_time must be a FUTURE ISO8601 datetime in timezone {$timezone}; "
      . "default to {$defaultIso} unless the history clearly favors another future slot.\n\n"
      . "Context:\n"
      . "- Selected platforms: [{$platformsList}]\n"
      . "- {$historyLine}\n"
      . "- Current local time: {$nowLocal}\n"
      . "- Draft (may be empty): \"{$draftExcerpt}\"";
  }
}
