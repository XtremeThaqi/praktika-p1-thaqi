<?php

namespace Tests\Feature;

use App\Models\Business;
use Database\Seeders\VerifiedLipjanBusinessesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifiedLipjanBusinessesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_optional_sourced_listings_expose_real_map_data_without_changing_base_seed(): void
    {
        $this->seed();

        $this->assertDatabaseCount('businesses', 30);
        $this->assertSame(26, Business::published()->count());

        $this->seed(VerifiedLipjanBusinessesSeeder::class);

        $this->assertDatabaseCount('businesses', 33);
        $this->assertDatabaseCount('settlements', 5);
        $this->assertSame(29, Business::published()->count());
        $this->assertSame(30, Business::where('is_demo', true)->count());

        foreach (['restaurant-mangall-janjeve', 'neptun-lipjan', 'ramjani-babush'] as $slug) {
            $business = Business::where('slug', $slug)->firstOrFail();
            $this->assertSame('published', $business->status);
            $this->assertFalse($business->is_demo);
            $this->assertTrue($business->location_verified);
            $this->assertNotNull($business->latitude);
            $this->assertNotNull($business->longitude);
            $this->assertNotEmpty($business->phone);
            $this->assertNotEmpty($business->address);
            $this->getJson('/api/businesses/'.$slug)->assertOk()
                ->assertJsonPath('data.id', $business->id);
        }

        $this->getJson('/api/businesses?has_website=1')->assertOk()
            ->assertJsonPath('meta.total', 3);
        $this->getJson('/api/businesses?q=Neptun')->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', 'neptun-lipjan');
    }

    public function test_optional_sourced_listings_do_not_overwrite_administrator_edits_on_rerun(): void
    {
        $this->seed();
        $this->seed(VerifiedLipjanBusinessesSeeder::class);

        $business = Business::where('slug', 'neptun-lipjan')->firstOrFail();
        $id = $business->id;
        $business->update(['description' => 'Administrator-reviewed description']);

        $this->seed(VerifiedLipjanBusinessesSeeder::class);

        $this->assertDatabaseCount('businesses', 33);
        $this->assertSame($id, $business->fresh()->id);
        $this->assertSame('Administrator-reviewed description', $business->fresh()->description);
    }
}
