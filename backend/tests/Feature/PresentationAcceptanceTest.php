<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Settlement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PresentationAcceptanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_isolated_fixture_exercises_profile_contact_website_filter_and_map_data(): void
    {
        $this->seed();
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $created = $this->postJson('/api/admin/businesses', [
            'name' => 'Acceptance fixture only',
            'description' => 'Test-only record. This is not a real business or storefront.',
            'category_id' => Category::where('slug', 'tregti')->value('id'),
            'settlement_id' => Settlement::where('slug', 'lipjan')->value('id'),
            'address' => 'Test-only location, not a storefront',
            'phone' => '+383 00 000 000',
            'email' => 'fixture@example.com',
            'website' => 'https://example.com',
            'latitude' => 42.52,
            'longitude' => 21.12,
            'location_verified' => false,
            'is_demo' => true,
        ])->assertCreated();
        $id = $created->json('data.id');
        $slug = $created->json('data.slug');
        $this->patchJson("/api/admin/businesses/$id/publish")->assertOk();

        $this->getJson('/api/businesses/'.$slug)->assertOk()
            ->assertJsonPath('data.id', $id)
            ->assertJsonPath('data.phone', '+383 00 000 000')
            ->assertJsonPath('data.email', 'fixture@example.com')
            ->assertJsonPath('data.website', 'https://example.com')
            ->assertJsonPath('data.address', 'Test-only location, not a storefront')
            ->assertJsonPath('data.latitude', '42.5200000')
            ->assertJsonPath('data.longitude', '21.1200000')
            ->assertJsonPath('data.location_verified', false);
        $this->getJson('/api/businesses?has_website=1')->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $id);
        $this->getJson('/api/businesses?q=Acceptance%20fixture')->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $id);
    }
}
