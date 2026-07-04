<?php

namespace App\Http\Requests\Integrations;

use App\Constants\IntegrationEvents;
use App\Models\Integrations\IntegrationEventSubscription;
use Illuminate\Foundation\Http\FormRequest;

class StoreIntegrationSubscriptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'channel_type' => ['required', 'string', 'in:' . implode(',', array_keys(IntegrationEventSubscription::supportedChannels()))],
            'channel_name' => 'nullable|string|max:128',
            'event_type'   => ['required', 'string', 'in:' . implode(',', IntegrationEvents::all())],
            'config'       => 'required|array',
            'is_active'    => 'boolean',
        ];
    }
}
