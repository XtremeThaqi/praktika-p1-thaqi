<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use App\Models\Service;
use App\Models\Settlement;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BusinessDatabaseTest extends TestCase
{
    use RefreshDatabase;

    private function createBusiness(): Business
    {
        $category = Category::create(['name' => 'Test category', 'slug' => 'test-category']);
        $settlement = Settlement::create(['name' => 'Test settlement', 'slug' => 'test-settlement']);

        return Business::create([
            'name' => 'Test business', 'slug' => 'test-business',
            'category_id' => $category->id, 'settlement_id' => $settlement->id,
        ]);
    }

    public function test_business_relationships_work_in_both_directions(): void
    {
        $business = $this->createBusiness();
        $service = Service::create(['name' => 'Test service', 'slug' => 'test-service']);
        $business->services()->attach($service);
        $hour = $business->hours()->create([
            'day_of_week' => 1, 'opens_at' => '08:00', 'closes_at' => '17:00',
        ]);
        $image = $business->images()->create([
            'path' => '/demo/business-logo.svg', 'alt_text' => 'Demo logo', 'kind' => 'logo',
        ]);
        $ad = $business->advertisements()->create([
            'image_path' => '/demo/advertisement.svg', 'alt_text' => 'Demo ad',
            'destination' => 'https://example.com', 'placement' => 'home_banner',
            'starts_at' => now(), 'ends_at' => now()->addDay(),
        ]);

        $this->assertTrue($business->category->businesses->contains($business));
        $this->assertTrue($business->settlement->businesses->contains($business));
        $this->assertTrue($business->services->contains($service));
        $this->assertTrue($service->businesses->contains($business));
        $this->assertTrue($hour->business->is($business));
        $this->assertTrue($image->business->is($business));
        $this->assertTrue($ad->business->is($business));
        $this->assertTrue($business->hours->contains($hour));
        $this->assertTrue($business->images->contains($image));
        $this->assertTrue($business->advertisements->contains($ad));
    }

    public function test_drafts_can_be_incomplete_and_only_published_records_match_the_scope(): void
    {
        $draft = Business::create(['name' => 'Incomplete draft', 'slug' => 'draft']);
        $this->assertSame('draft', $draft->fresh()->status);
        $this->assertNull($draft->category_id);
        $this->assertNull($draft->latitude);
        $published = Business::create(['name' => 'Published demo', 'slug' => 'published', 'status' => 'published']);
        Business::create(['name' => 'Archived demo', 'slug' => 'archived', 'status' => 'archived']);

        $this->assertSame([$published->id], Business::published()->pluck('id')->all());
    }

    public function test_invalid_business_status_is_rejected_by_the_database(): void
    {
        $this->expectException(QueryException::class);
        Business::create(['name' => 'Invalid', 'slug' => 'invalid', 'status' => 'unknown']);
    }

    public function test_business_slug_is_unique(): void
    {
        $business = $this->createBusiness();
        $this->expectException(QueryException::class);
        Business::create(['name' => 'Duplicate', 'slug' => $business->slug]);
    }

    public function test_missing_foreign_keys_are_rejected(): void
    {
        $this->expectException(QueryException::class);
        Business::create(['name' => 'Orphan', 'slug' => 'orphan', 'category_id' => 999999]);
    }

    #[DataProvider('taxonomyDuplicates')]
    public function test_taxonomy_names_and_slugs_are_unique(string $model, string $field): void
    {
        $model::create(['name' => 'Original', 'slug' => 'original']);
        $attributes = ['name' => 'Different', 'slug' => 'different'];
        $attributes[$field] = $field === 'name' ? 'Original' : 'original';

        $this->expectException(QueryException::class);
        $model::create($attributes);
    }

    public static function taxonomyDuplicates(): array
    {
        return [
            [Category::class, 'name'], [Category::class, 'slug'],
            [Settlement::class, 'name'], [Settlement::class, 'slug'],
            [Service::class, 'name'], [Service::class, 'slug'],
        ];
    }

    #[DataProvider('referencedTaxonomies')]
    public function test_referenced_taxonomy_deletion_is_restricted(string $relationship): void
    {
        $business = $this->createBusiness();
        $service = Service::create(['name' => 'Linked service', 'slug' => 'linked-service']);
        $business->services()->attach($service);
        $taxonomy = $relationship === 'service' ? $service : $business->$relationship;

        $this->expectException(QueryException::class);
        $taxonomy->delete();
    }

    public static function referencedTaxonomies(): array
    {
        return [['category'], ['settlement'], ['service']];
    }

    public function test_duplicate_service_links_are_rejected(): void
    {
        $business = $this->createBusiness();
        $service = Service::create(['name' => 'Linked service', 'slug' => 'linked-service']);
        $business->services()->attach($service);

        $this->expectException(QueryException::class);
        $business->services()->attach($service);
    }

    public function test_duplicate_opening_days_are_rejected(): void
    {
        $business = $this->createBusiness();
        $hours = ['day_of_week' => 0, 'is_closed' => true];
        $business->hours()->create($hours);

        $this->expectException(QueryException::class);
        $business->hours()->create($hours);
    }

    public function test_deleting_a_business_removes_its_owned_records_but_keeps_taxonomies(): void
    {
        $business = $this->createBusiness();
        $service = Service::create(['name' => 'Linked service', 'slug' => 'linked-service']);
        $business->services()->attach($service);
        $business->hours()->create(['day_of_week' => 0, 'is_closed' => true]);
        $business->images()->create(['path' => '/demo/business-logo.svg', 'alt_text' => 'Demo']);
        $business->advertisements()->create([
            'image_path' => '/demo/advertisement.svg', 'alt_text' => 'Demo',
            'destination' => 'https://example.com', 'placement' => 'home_banner',
            'starts_at' => now(), 'ends_at' => now()->addDay(),
        ]);

        $business->delete();

        foreach (['business_service', 'business_hours', 'business_images', 'advertisements'] as $table) {
            $this->assertDatabaseMissing($table, ['business_id' => $business->id]);
        }
        $this->assertDatabaseHas('categories', ['id' => $business->category_id]);
        $this->assertDatabaseHas('settlements', ['id' => $business->settlement_id]);
        $this->assertDatabaseHas('services', ['id' => $service->id]);
    }

    #[DataProvider('invalidCoordinates')]
    public function test_mysql_rejects_invalid_coordinates(?float $latitude, ?float $longitude): void
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->markTestSkipped('Range checks are exercised by the MySQL/MariaDB suite.');
        }

        $this->expectException(QueryException::class);
        Business::create([
            'name' => 'Invalid coordinates', 'slug' => 'invalid-coordinates',
            'latitude' => $latitude, 'longitude' => $longitude,
        ]);
    }

    public static function invalidCoordinates(): array
    {
        return [[90.1, 21], [-90.1, 21], [42, 180.1], [42, -180.1], [42, null], [null, 21]];
    }

    #[DataProvider('invalidHours')]
    public function test_mysql_rejects_invalid_opening_hours(array $attributes): void
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->markTestSkipped('Time and weekday checks are exercised by the MySQL/MariaDB suite.');
        }

        $business = $this->createBusiness();
        $this->expectException(QueryException::class);
        $business->hours()->create($attributes);
    }

    public static function invalidHours(): array
    {
        return [
            [['day_of_week' => 7, 'is_closed' => true]],
            [['day_of_week' => 1, 'is_closed' => false]],
            [['day_of_week' => 1, 'opens_at' => '08:00', 'closes_at' => '08:00']],
            [['day_of_week' => 1, 'is_closed' => true, 'opens_at' => '08:00', 'closes_at' => '17:00']],
        ];
    }

    public function test_mysql_accepts_overnight_hours(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->markTestSkipped('Time checks are exercised by the MySQL/MariaDB suite.');
        }

        $business = $this->createBusiness();
        $business->hours()->create(['day_of_week' => 5, 'opens_at' => '22:00', 'closes_at' => '02:00']);
        $this->assertSame('02:00:00', $business->hours()->first()->closes_at);
    }

    public function test_mysql_taxonomy_names_are_case_insensitive(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->markTestSkipped('SQLite has a different default collation.');
        }

        Category::create(['name' => 'Gastronomi', 'slug' => 'gastronomi']);
        $this->expectException(QueryException::class);
        Category::create(['name' => 'GASTRONOMI', 'slug' => 'another-slug']);
    }
}
