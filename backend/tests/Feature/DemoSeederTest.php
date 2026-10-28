<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_data_covers_relationships_statuses_and_optional_information(): void
    {
        $this->seed();

        $expectedCounts = [
            'categories' => 6, 'settlements' => 4, 'services' => 10, 'businesses' => 30,
            'business_service' => 85, 'business_hours' => 140, 'business_images' => 26,
            'advertisements' => 6,
        ];
        foreach ($expectedCounts as $table => $count) {
            $this->assertDatabaseCount($table, $count);
        }

        $this->assertSame(30, Business::where('is_demo', true)->count());
        $this->assertSame(0, Business::where('name', 'like', '%(Demo)')->count());
        $this->assertSame(0, Business::where('location_verified', true)->count());
        $this->assertSame(26, Business::published()->count());
        $this->assertSame(2, Business::where('status', 'draft')->count());
        $this->assertSame(2, Business::where('status', 'archived')->count());
        $this->assertSame(0, Business::whereNotNull('website')->count());
        $this->assertSame(0, Business::whereNotNull('email')->count());
        $this->assertSame(0, Business::whereNotNull('social_links')->count());
        $this->assertSame(0, Business::whereNotNull('phone')->count());
        $this->assertSame(0, Business::whereNotNull('latitude')->count());
        $this->assertSame(20, Business::has('hours')->count());
        $this->assertSame(26, Business::has('images')->count());
        $this->assertSame(30, Business::has('services', '>=', 2)->count());
        $this->assertSame(6, Business::where('is_featured', true)->published()->count());

        $draft = Business::where('slug', 'demo-biznes-28')->firstOrFail();
        $this->assertNull($draft->category_id);
        $this->assertNull($draft->latitude);

        foreach (Business::published()->with('images')->get() as $business) {
            $this->assertGreaterThanOrEqual(120, mb_strlen($business->description));
            $this->assertCount(1, $business->images);
            $this->assertStringContainsString('fotografi ilustruese', mb_strtolower($business->images[0]->alt_text));
            $this->assertFileExists(public_path(ltrim($business->images[0]->path, '/')));
        }
    }

    public function test_rerunning_seeders_preserves_ids_counts_and_non_demo_records(): void
    {
        $user = User::factory()->create();
        $realBusiness = Business::create(['name' => 'Existing record', 'slug' => 'existing-record']);
        $this->seed();
        $businessIds = Business::orderBy('id')->pluck('id')->all();
        $advertisementIds = Advertisement::orderBy('id')->pluck('id')->all();
        $counts = [];
        foreach (['categories', 'settlements', 'services', 'business_service', 'business_hours', 'business_images'] as $table) {
            $counts[$table] = DB::table($table)->count();
        }

        $seeded = Business::where('slug', 'demo-biznes-02')->firstOrFail();
        $image = $seeded->images()->firstOrFail();
        $image->update(['path' => '/demo/business-logo.svg']);
        $seeded->images()->create(['sort_order' => 1, 'path' => '/demo/business-gallery.svg', 'alt_text' => 'Old illustration']);
        $advertisement = Advertisement::where('business_id', $seeded->id)->firstOrFail();
        $advertisement->update(['image_path' => '/demo/advertisement.svg', 'destination' => 'https://example.com']);
        $anotherAd = Advertisement::where('business_id', Business::where('slug', 'demo-biznes-03')->firstOrFail()->id)
            ->firstOrFail();
        $anotherAd->update(['image_path' => '/storage/advertisements/custom.jpg']);

        $this->seed();

        $this->assertSame($businessIds, Business::orderBy('id')->pluck('id')->all());
        $this->assertSame($advertisementIds, Advertisement::orderBy('id')->pluck('id')->all());
        foreach ($counts as $table => $count) {
            $this->assertDatabaseCount($table, $count);
        }
        $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => $user->email]);
        $this->assertSame('Existing record', $realBusiness->fresh()->name);
        $this->assertFalse($realBusiness->fresh()->is_demo);
        $this->assertSame('/demo/photos/02.jpg', $image->fresh()->path);
        $this->assertSame('/demo/photos/02.jpg', $advertisement->fresh()->image_path);
        $this->assertNull($advertisement->fresh()->destination);
        $this->assertSame('/demo/photos/03.jpg', $anotherAd->fresh()->image_path);
    }

    public function test_demo_advertisements_cover_current_future_expired_and_disabled_states(): void
    {
        $this->travelTo(now()->startOfSecond());
        $this->seed();

        $this->assertSame(3, Advertisement::active()->count());
        $this->assertSame(2, Advertisement::active()->where('placement', 'home_banner')->count());
        $this->assertSame(1, Advertisement::active()->where('placement', 'results_sidebar')->count());
        $this->assertSame(1, Advertisement::where('starts_at', '>', now())->count());
        $this->assertSame(1, Advertisement::where('ends_at', '<=', now())->count());
        $this->assertSame(1, Advertisement::where('is_active', false)->count());
        $this->assertSame(20, Advertisement::active()->orderByDesc('priority')->first()->priority);
        foreach (Advertisement::with('business')->get() as $advertisement) {
            $this->assertNull($advertisement->destination);
            $this->assertFileExists(public_path(ltrim($advertisement->image_path, '/')));
        }
    }
}
