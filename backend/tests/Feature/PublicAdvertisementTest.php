<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicAdvertisementTest extends TestCase
{
    use RefreshDatabase;

    public function test_one_highest_priority_ad_is_returned_per_placement_separately_from_businesses(): void
    {
        $this->seed();
        $this->getJson('/api/advertisements')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.business.slug', 'demo-biznes-02')
            ->assertJsonPath('data.1.business.slug', 'demo-biznes-03');
        $this->getJson('/api/advertisements?placement=home_banner')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.business.slug', 'demo-biznes-02')->assertHeader('Cache-Control', 'no-store, private');
        $this->getJson('/api/businesses')->assertOk()->assertJsonPath('meta.total', 26);
    }

    public function test_equal_priorities_use_oldest_creation_then_id(): void
    {
        $this->seed();
        $ads = Advertisement::active()->where('placement', 'home_banner')->orderBy('id')->get();
        $first = $ads[0];
        $second = $ads[1];
        $first->forceFill(['priority' => 20, 'created_at' => now()->subDay()])->save();
        $second->forceFill(['priority' => 20, 'created_at' => now()->subDays(2)])->save();
        $this->getJson('/api/advertisements?placement=home_banner')->assertOk()->assertJsonPath('data.0.id', $second->id);
        $second->forceFill(['created_at' => $first->created_at])->save();
        $this->getJson('/api/advertisements?placement=home_banner')->assertOk()->assertJsonPath('data.0.id', $first->id);
    }

    public function test_scheduled_expired_disabled_and_unpublished_ads_are_excluded_at_time_boundaries(): void
    {
        $this->travelTo(now()->startOfSecond());
        $this->seed();
        $ad = Advertisement::active()->firstOrFail();
        Advertisement::where('id', '!=', $ad->id)->update(['is_active' => false]);
        $ad->update(['starts_at' => now()->addHour(), 'ends_at' => now()->addHours(2)]);
        $this->getJson('/api/advertisements')->assertOk()->assertExactJson(['data' => []]);
        $this->travelTo($ad->starts_at);
        $this->getJson('/api/advertisements')->assertOk()->assertJsonPath('data.0.id', $ad->id);
        foreach (['draft', 'archived'] as $status) {
            $ad->business->update(['status' => $status]);
            $this->getJson('/api/advertisements')->assertOk()->assertExactJson(['data' => []]);
        }
        $ad->business->update(['status' => 'published']);
        $ad->update(['is_active' => false]);
        $this->getJson('/api/advertisements')->assertOk()->assertExactJson(['data' => []]);
        $ad->update(['is_active' => true]);
        $this->travelTo($ad->ends_at->copy()->subSecond());
        $this->getJson('/api/advertisements')->assertOk()->assertJsonCount(1, 'data');
        $this->travelTo($ad->ends_at);
        $this->getJson('/api/advertisements')->assertOk()->assertExactJson(['data' => []]);
        $this->travelTo($ad->ends_at->copy()->addSecond());
        $this->getJson('/api/advertisements')->assertOk()->assertExactJson(['data' => []]);
    }

    public function test_unknown_or_array_placement_is_rejected(): void
    {
        foreach (['placement=unknown', 'placement[]=home_banner'] as $query) {
            $this->get('/api/advertisements?'.$query)->assertUnprocessable()->assertJsonValidationErrors('placement');
        }
    }
}
