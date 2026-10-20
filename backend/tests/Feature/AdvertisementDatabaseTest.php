<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use App\Models\Business;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AdvertisementDatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_ads_require_a_published_business_and_an_inclusive_start_and_exclusive_end(): void
    {
        $this->travelTo(now()->startOfSecond());
        $business = Business::create(['name' => 'Demo', 'slug' => 'demo', 'status' => 'published']);
        $ad = $business->advertisements()->create([
            'image_path' => '/demo/advertisement.svg', 'alt_text' => 'Demo',
            'destination' => 'https://example.com', 'placement' => 'home_banner',
            'starts_at' => now()->addHour(), 'ends_at' => now()->addHours(2),
            'is_active' => true,
        ]);

        $this->assertSame(0, Advertisement::active()->count());
        $this->travelTo($ad->starts_at);
        $this->assertSame([$ad->id], Advertisement::active()->pluck('id')->all());

        $business->update(['status' => 'draft']);
        $this->assertSame(0, Advertisement::active()->count());
        $business->update(['status' => 'archived']);
        $this->assertSame(0, Advertisement::active()->count());
        $business->update(['status' => 'published']);
        $ad->update(['is_active' => false]);
        $this->assertSame(0, Advertisement::active()->count());
        $ad->update(['is_active' => true]);

        $this->travelTo($ad->ends_at->copy()->subSecond());
        $this->assertSame(1, Advertisement::active()->count());
        $this->travelTo($ad->ends_at);
        $this->assertSame(0, Advertisement::active()->count());
        $this->travelTo($ad->ends_at->copy()->addSecond());
        $this->assertSame(0, Advertisement::active()->count());
    }

    public function test_invalid_ad_placement_is_rejected(): void
    {
        $business = Business::create(['name' => 'Demo', 'slug' => 'demo']);
        $this->expectException(QueryException::class);
        $business->advertisements()->create([
            'image_path' => '/demo/advertisement.svg', 'alt_text' => 'Demo',
            'destination' => 'https://example.com', 'placement' => 'unknown',
            'starts_at' => now(), 'ends_at' => now()->addDay(),
        ]);
    }

    #[DataProvider('invalidDateIntervals')]
    public function test_mysql_rejects_advertisements_without_a_positive_duration(int $endDays): void
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->markTestSkipped('Date checks are exercised by the MySQL/MariaDB suite.');
        }

        $business = Business::create(['name' => 'Demo', 'slug' => 'demo']);
        $start = now()->startOfSecond();
        $this->expectException(QueryException::class);
        $business->advertisements()->create([
            'image_path' => '/demo/advertisement.svg', 'alt_text' => 'Demo',
            'destination' => 'https://example.com', 'placement' => 'home_banner',
            'starts_at' => $start, 'ends_at' => $start->copy()->addDays($endDays),
        ]);
    }

    public static function invalidDateIntervals(): array
    {
        return [[0], [-1]];
    }
}
