<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class BusinessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $request->routeIs('businesses.show');
        $image = $this->images->firstWhere('kind', 'logo') ?? $this->images->first();

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $profile ? $this->description : Str::limit($this->description, 220),
            'category' => $this->category?->only(['id', 'name', 'slug']),
            'settlement' => $this->settlement?->only(['id', 'name', 'slug']),
            'address' => $profile ? $this->address : Str::limit($this->address, 120),
            'phone' => $this->phone,
            'email' => $this->email,
            'website' => $this->website,
            'social_links' => $this->social_links,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'location_verified' => $this->location_verified,
            'is_demo' => $this->is_demo,
            'is_featured' => $this->is_featured,
            'image' => $image?->only(['id', 'path', 'alt_text', 'kind']),
            'services' => $this->whenLoaded('services', fn () => $this->services->map->only(['id', 'name', 'slug'])),
            'hours' => $this->whenLoaded('hours', fn () => $this->hours->map->only(['day_of_week', 'opens_at', 'closes_at', 'is_closed'])),
            'images' => $this->when($profile, fn () => $this->images->map->only(['id', 'path', 'alt_text', 'kind', 'sort_order'])),
        ];
    }
}
