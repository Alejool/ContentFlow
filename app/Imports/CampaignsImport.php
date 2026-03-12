<?php

namespace App\Imports;

use App\Models\Campaigns\Campaign;
use App\Models\Publications\Publication;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;

class CampaignsImport implements ToCollection, WithHeadingRow, SkipsOnError
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

                $this->createCampaign($row->toArray());
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,completed,paused',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'goal' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'publication_ids' => 'nullable|string',
        ]);
    }

    protected function createCampaign(array $row)
    {
        $data = [
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->current_workspace_id,
            'name' => $row['name'],
            'description' => $row['description'] ?? null,
            'status' => $row['status'] ?? 'active',
            'goal' => $row['goal'] ?? null,
            'budget' => $row['budget'] ?? null,
        ];

        // Handle dates
        if (!empty($row['start_date'])) {
            $data['start_date'] = \Carbon\Carbon::parse($row['start_date']);
        }

        if (!empty($row['end_date'])) {
            $data['end_date'] = \Carbon\Carbon::parse($row['end_date']);
        }

        $campaign = Campaign::create($data);

        // Attach publications if provided
        if (!empty($row['publication_ids'])) {
            $this->attachPublications($campaign, $row['publication_ids']);
        }

        return $campaign;
    }

    protected function attachPublications(Campaign $campaign, string $publicationIds)
    {
        $ids = array_map('trim', explode(',', $publicationIds));
        $validIds = [];

        foreach ($ids as $id) {
            if (is_numeric($id)) {
                $publication = Publication::find($id);
                if ($publication && $publication->workspace_id === Auth::user()->current_workspace_id) {
                    $validIds[] = $id;
                }
            }
        }

        if (!empty($validIds)) {
            $campaign->publications()->attach($validIds);
        }
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
