<?php

namespace Tests\Unit\Requests;

use App\Http\Requests\BulkUpdateRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class BulkUpdateRequestTest extends TestCase
{
    private function validateRequest(array $data): \Illuminate\Validation\Validator
    {
        $request = new BulkUpdateRequest();
        return Validator::make($data, $request->rules(), $request->messages());
    }

    public function test_validates_required_fields()
    {
        $validator = $this->validateRequest([]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('event_ids', $validator->errors()->toArray());
        $this->assertArrayHasKey('new_date', $validator->errors()->toArray());
        $this->assertArrayHasKey('operation', $validator->errors()->toArray());
    }

    public function test_validates_event_ids_must_be_array()
    {
        $validator = $this->validateRequest([
            'event_ids' => 'not-an-array',
            'new_date' => '2024-12-31',
            'operation' => 'move',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('event_ids', $validator->errors()->toArray());
    }

    public function test_validates_event_ids_minimum_one()
    {
        $validator = $this->validateRequest([
            'event_ids' => [],
            'new_date' => '2024-12-31',
            'operation' => 'move',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('event_ids', $validator->errors()->toArray());
    }

    public function test_validates_each_event_id_must_be_string()
    {
        $validator = $this->validateRequest([
            'event_ids' => ['valid_id', 123, null],
            'new_date' => '2024-12-31',
            'operation' => 'move',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('event_ids.1', $validator->errors()->toArray());
        $this->assertArrayHasKey('event_ids.2', $validator->errors()->toArray());
    }

    public function test_validates_new_date_must_be_valid_date()
    {
        $validator = $this->validateRequest([
            'event_ids' => ['pub_1'],
            'new_date' => 'not-a-date',
            'operation' => 'move',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('new_date', $validator->errors()->toArray());
    }

    public function test_validates_operation_must_be_move_or_delete()
    {
        $validator = $this->validateRequest([
            'event_ids' => ['pub_1'],
            'new_date' => '2024-12-31',
            'operation' => 'invalid',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('operation', $validator->errors()->toArray());
    }

    public function test_passes_validation_with_valid_move_operation()
    {
        $validator = $this->validateRequest([
            'event_ids' => ['pub_1', 'pub_2'],
            'new_date' => '2024-12-31',
            'operation' => 'move',
        ]);

        $this->assertFalse($validator->fails());
    }

    public function test_passes_validation_with_valid_delete_operation()
    {
        $validator = $this->validateRequest([
            'event_ids' => ['pub_1'],
            'new_date' => '2024-12-31',
            'operation' => 'delete',
        ]);

        $this->assertFalse($validator->fails());
    }

    public function test_custom_error_messages_are_defined()
    {
        $request = new BulkUpdateRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('event_ids.required', $messages);
        $this->assertArrayHasKey('event_ids.array', $messages);
        $this->assertArrayHasKey('event_ids.min', $messages);
        $this->assertArrayHasKey('new_date.required', $messages);
        $this->assertArrayHasKey('new_date.date', $messages);
        $this->assertArrayHasKey('operation.required', $messages);
        $this->assertArrayHasKey('operation.in', $messages);
    }
}
