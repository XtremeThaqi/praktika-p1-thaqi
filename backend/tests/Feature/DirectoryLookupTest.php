<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Service;
use App\Models\Settlement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirectoryLookupTest extends TestCase
{
    use RefreshDatabase;

    public function test_lookup_endpoints_return_current_database_values_without_authentication(): void
    {
        $this->seed();
        foreach (['categories' => Category::class, 'settlements' => Settlement::class, 'services' => Service::class] as $path => $model) {
            $response = $this->getJson('/api/'.$path)->assertOk();
            $this->assertSame($model::orderBy('name')->orderBy('id')->pluck('slug')->all(), array_column($response->json('data'), 'slug'));
            $new = $model::create(['name' => 'New lookup', 'slug' => 'new-lookup']);
            $this->getJson('/api/'.$path)->assertOk()->assertJsonFragment(['id' => $new->id, 'name' => $new->name, 'slug' => $new->slug]);
        }
    }

    public function test_empty_lookups_return_empty_lists(): void
    {
        foreach (['categories', 'settlements', 'services'] as $path) {
            $this->getJson('/api/'.$path)->assertOk()->assertExactJson(['data' => []]);
        }
    }
}
