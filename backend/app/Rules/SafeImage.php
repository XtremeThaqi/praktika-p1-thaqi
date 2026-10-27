<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class SafeImage implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile || ! $value->isValid()) {
            $fail('Ngarkimi i imazhit dështoi.');

            return;
        }
        $extension = strtolower($value->getClientOriginalExtension());
        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true) || $value->getSize() > 5 * 1024 * 1024) {
            $fail('Imazhi duhet të jetë JPG, PNG ose WebP dhe jo më i madh se 5 MB.');

            return;
        }
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($value->getRealPath());
        $dimensions = @getimagesize($value->getRealPath());
        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)
            || ! is_array($dimensions) || ($dimensions[0] ?? 0) < 1 || ($dimensions[1] ?? 0) < 1
            || $dimensions[0] > 10000 || $dimensions[1] > 10000 || ($dimensions[0] * $dimensions[1]) > 25000000) {
            $fail('Skedari nuk është imazh i vlefshëm ose tejkalon kufijtë e lejuar.');
        }
    }
}
