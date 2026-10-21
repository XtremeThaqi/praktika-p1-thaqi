<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:200'],
            'category' => ['nullable', 'string', 'max:160', 'exists:categories,slug'],
            'settlement' => ['nullable', 'string', 'max:160', 'exists:settlements,slug'],
            'service' => ['nullable', 'string', 'max:160', 'exists:services,slug'],
            'has_website' => ['nullable', 'boolean'],
            'has_hours' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['name_asc', 'name_desc', 'newest'])],
            'page' => ['sometimes', 'integer', 'min:1', 'max:100000'],
        ];
    }
}
