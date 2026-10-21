<?php

namespace Tests\Feature;

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicBusinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_published_businesses_are_paginated_without_duplicates(): void
    {
        $this->seed();
        $ids = [];
        foreach ([1 => 12, 2 => 12, 3 => 2] as $page => $count) {
            $response = $this->getJson('/api/businesses?page='.$page)
                ->assertOk()->assertJsonCount($count, 'data')
                ->assertJsonPath('meta.total', 26)->assertJsonPath('meta.per_page', 12)
                ->assertJsonPath('meta.current_page', $page)->assertJsonPath('meta.last_page', 3);
            $ids = array_merge($ids, array_column($response->json('data'), 'id'));
        }
        $this->assertCount(26, array_unique($ids));
        $expected = Business::published()->orderBy('name')->orderBy('id')->pluck('id')->all();
        $this->assertSame($expected, $ids);
    }

    public function test_profile_returns_public_relationships_and_full_description(): void
    {
        $this->seed();
        $business = Business::where('slug', 'demo-biznes-02')->firstOrFail();
        $description = str_repeat('Përshkrim i plotë. ', 40);
        $business->update(['description' => $description]);
        $response = $this->getJson('/api/businesses/'.$business->slug)->assertOk()
            ->assertJsonPath('data.description', $description)
            ->assertJsonPath('data.category.id', $business->category_id)
            ->assertJsonPath('data.settlement.id', $business->settlement_id)
            ->assertJsonPath('data.phone', $business->phone)
            ->assertJsonPath('data.is_demo', true)
            ->assertJsonCount($business->services()->count(), 'data.services')
            ->assertJsonCount(7, 'data.hours')->assertJsonCount(1, 'data.images');
        $this->assertArrayNotHasKey('status', $response->json('data'));
        $this->getJson('/api/businesses?q=Dyqani')->assertOk();
        $list = $this->getJson('/api/businesses')->json('data');
        $card = collect($list)->firstWhere('id', $business->id);
        $this->assertLessThan(mb_strlen($description), mb_strlen($card['description']));
    }

    public function test_optional_profile_fields_remain_null_or_empty(): void
    {
        Business::create(['name' => 'Minimal demo', 'slug' => 'minimal', 'status' => 'published']);
        $this->getJson('/api/businesses/minimal')->assertOk()
            ->assertJsonPath('data.email', null)->assertJsonPath('data.website', null)
            ->assertJsonPath('data.description', null)->assertJsonPath('data.latitude', null)
            ->assertJsonPath('data.image', null)->assertJsonPath('data.category', null)
            ->assertJsonPath('data.services', [])->assertJsonPath('data.hours', []);
    }

    public function test_missing_draft_and_archived_profiles_return_the_same_safe_404(): void
    {
        $this->seed();
        foreach (['missing', 'demo-biznes-27', 'demo-biznes-29'] as $slug) {
            $this->get('/api/businesses/'.$slug)->assertNotFound()
                ->assertExactJson(['message' => 'Burimi nuk u gjet.']);
        }
    }
}
