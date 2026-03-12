<?php

namespace App\Imports;

use App\Models\Publications\Publication;
use App\Models\MediaFiles\MediaFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;

class PublicationsImport implements ToCollection, WithHeadingRow, SkipsOnError
{
    use SkipsErrors;

    protected $errors = [];
    protected $successCount = 0;
    protected $failedCount = 0;

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            // Saltar la primera fila (índice 0) que contiene las descripciones
            if ($index === 0) {
                continue;
            }

            try {
                $validator = $this->validateRow($row->toArray(), $index + 2);
                
                if ($validator->fails()) {
                    $this->errors[] = [
                        'row' => $index + 2,
                        'errors' => $validator->errors()->all()
                    ];
                    $this->failedCount++;
                    continue;
                }

                $this->createPublication($row->toArray());
                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = [
                    'row' => $index + 2,
                    'errors' => [$e->getMessage()]
                ];
                $this->failedCount++;
            }
        }
    }

    protected function validateRow(array $row, int $rowNumber)
    {
        return Validator::make($row, [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'content_type' => 'required|in:post,reel,story,poll,carousel',
            'status' => 'nullable|in:draft,published,scheduled,pending_review',
            'scheduled_at' => 'nullable|date',
            'hashtags' => 'nullable|string',
            'url' => 'nullable|url',
            'description' => 'nullable|string',
            'media_urls' => 'nullable|string',
            'poll_options' => 'nullable|string',
            'poll_duration_hours' => 'nullable|integer|min:1|max:168',
        ]);
    }

    protected function createPublication(array $row)
    {
        $data = [
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->current_workspace_id,
            'title' => $row['title'],
            'slug' => Str::slug($row['title']) . '-' . Str::random(6),
            'body' => $row['body'],
            'content_type' => $row['content_type'],
            'status' => $row['status'] ?? 'draft',
            'description' => $row['description'] ?? null,
            'url' => $row['url'] ?? null,
        ];

        // Handle scheduled_at
        if (!empty($row['scheduled_at'])) {
            $data['scheduled_at'] = \Carbon\Carbon::parse($row['scheduled_at']);
        }

        // Handle hashtags
        if (!empty($row['hashtags'])) {
            $hashtags = array_map('trim', explode(',', $row['hashtags']));
            $data['hashtags'] = array_map(function($tag) {
                return str_starts_with($tag, '#') ? $tag : '#' . $tag;
            }, $hashtags);
        }

        // Handle poll options
        if ($row['content_type'] === 'poll' && !empty($row['poll_options'])) {
            $data['poll_options'] = array_map('trim', explode('|', $row['poll_options']));
            $data['poll_duration_hours'] = $row['poll_duration_hours'] ?? 24;
        }

        $publication = Publication::create($data);

        // Handle media URLs
        if (!empty($row['media_urls'])) {
            $this->attachMedia($publication, $row['media_urls']);
        }

        return $publication;
    }

    protected function attachMedia(Publication $publication, string $mediaUrls)
    {
        $urls = array_map('trim', explode(',', $mediaUrls));
        
        foreach ($urls as $url) {
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                // Create media file record
                $mediaFile = MediaFile::create([
                    'user_id' => Auth::id(),
                    'workspace_id' => Auth::user()->current_workspace_id,
                    'file_name' => basename($url),
                    'file_path' => $url,
                    'file_type' => $this->guessFileType($url),
                    'file_size' => 0,
                    'mime_type' => 'application/octet-stream',
                ]);

                $publication->mediaFiles()->attach($mediaFile->id);
            }
        }
    }

    protected function guessFileType(string $url): string
    {
        $extension = strtolower(pathinfo($url, PATHINFO_EXTENSION));
        
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        $videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
        
        if (in_array($extension, $imageExtensions)) {
            return 'image';
        } elseif (in_array($extension, $videoExtensions)) {
            return 'video';
        }
        
        return 'other';
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getSuccessCount(): int
    {
        return $this->successCount;
    }

    public function getFailedCount(): int
    {
        return $this->failedCount;
    }
}
