<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use App\Models\Business;
use App\Models\Category;
use App\Models\Service;
use App\Models\Settlement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminBusinessManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
        $this->actingAs($user);
    }

    private function completeData(): array
    {
        return [
            'name' => 'Biznesi i testit',
            'description' => 'Përshkrim i plotë i biznesit.',
            'category_id' => Category::where('slug', 'gastronomi')->value('id'),
            'settlement_id' => Settlement::where('slug', 'lipjan')->value('id'),
            'address' => 'Rruga e testit, Lipjan',
            'phone' => '+383 44 123 456',
            'latitude' => 42.52,
            'longitude' => 21.12,
            'location_verified' => true,
        ];
    }

    public function test_administrator_lists_all_statuses_and_filters_results(): void
    {
        $this->seed();
        $this->admin();
        $this->getJson('/api/admin/businesses')->assertOk()->assertJsonPath('total', 30);
        $this->getJson('/api/admin/businesses?status=draft')->assertOk()
            ->assertJsonPath('total', 2)->assertJsonCount(2, 'data');
        $this->getJson('/api/admin/businesses?status=archived')->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/admin/businesses?q=Kuzhina')->assertOk()->assertJsonPath('total', 5);
        $this->getJson('/api/admin/businesses?page=2')->assertOk()->assertJsonPath('current_page', 2);
    }

    public function test_incomplete_draft_can_be_saved_but_cannot_be_published(): void
    {
        $this->seed();
        $this->admin();
        $response = $this->postJson('/api/admin/businesses', ['name' => 'Draft i ri'])
            ->assertCreated()->assertJsonPath('data.status', 'draft');
        $id = $response->json('data.id');
        $this->patchJson("/api/admin/businesses/$id/publish")->assertUnprocessable()
            ->assertJsonValidationErrors(['description', 'category_id', 'phone', 'address',
                'settlement_id', 'latitude', 'longitude', 'location_verified']);
        $this->assertDatabaseHas('businesses', ['id' => $id, 'status' => 'draft']);
        $this->getJson('/api/businesses/'.$response->json('data.slug'))->assertNotFound();
    }

    public function test_create_edit_publish_and_archive_are_reflected_publicly(): void
    {
        $this->seed();
        $this->admin();
        $serviceIds = Service::orderBy('id')->limit(2)->pluck('id')->all();
        $response = $this->postJson('/api/admin/businesses', array_merge($this->completeData(), [
            'services' => $serviceIds,
            'hours' => [['day_of_week' => 1, 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '17:00']],
        ]))->assertCreated();
        $id = $response->json('data.id');
        $slug = $response->json('data.slug');
        $this->assertDatabaseCount('business_service', 87);
        $this->assertDatabaseHas('business_hours', ['business_id' => $id, 'day_of_week' => 1]);
        $this->patchJson("/api/admin/businesses/$id/publish")->assertOk()->assertJsonPath('data.status', 'published');
        $this->getJson('/api/businesses/'.$slug)->assertOk()->assertJsonPath('data.phone', '+383 44 123 456')
            ->assertJsonCount(2, 'data.services')->assertJsonCount(1, 'data.hours');
        $this->getJson('/api/businesses?q=Biznesi%20i%20testit')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/businesses?category=gastronomi&settlement=lipjan&q=Biznesi')->assertJsonPath('meta.total', 1);

        $this->putJson("/api/admin/businesses/$id", [
            'phone' => '+383 44 222 333',
            'services' => [$serviceIds[1]],
            'hours' => [['day_of_week' => 2, 'is_closed' => true]],
        ])->assertOk();
        $this->getJson('/api/businesses/'.$slug)->assertJsonPath('data.phone', '+383 44 222 333')
            ->assertJsonCount(1, 'data.services')->assertJsonCount(1, 'data.hours');
        $this->assertDatabaseHas('business_hours', ['business_id' => $id, 'day_of_week' => 2, 'is_closed' => true]);

        $this->patchJson("/api/admin/businesses/$id/archive")->assertOk()->assertJsonPath('data.status', 'archived');
        $this->getJson('/api/businesses/'.$slug)->assertNotFound();
        $this->getJson('/api/businesses?q=Biznesi%20i%20testit')->assertJsonPath('meta.total', 0);
        $this->assertDatabaseHas('businesses', ['id' => $id, 'status' => 'archived']);
        $this->getJson("/api/admin/businesses/$id")->assertOk()->assertJsonPath('data.name', 'Biznesi i testit');
    }

    public function test_invalid_writes_preserve_business_and_relationships(): void
    {
        $this->seed();
        $this->admin();
        $business = Business::where('slug', 'demo-biznes-02')->firstOrFail();
        $oldPhone = $business->phone;
        $oldServices = $business->services()->pluck('services.id')->all();
        $this->putJson("/api/admin/businesses/$business->id", [
            'phone' => 'bad',
            'services' => [999999],
        ])->assertUnprocessable()->assertJsonValidationErrors(['phone', 'services.0']);
        $this->assertSame($oldPhone, $business->fresh()->phone);
        $this->assertSame($oldServices, $business->services()->pluck('services.id')->all());

        $this->putJson("/api/admin/businesses/$business->id", [
            'phone' => '+383 44 111 222',
            'hours' => [['day_of_week' => 1, 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '09:00']],
        ])->assertUnprocessable();
        $this->assertSame($oldPhone, $business->fresh()->phone);
        $this->putJson("/api/admin/businesses/$business->id", ['description' => null])
            ->assertUnprocessable()->assertJsonValidationErrors('description');
        $this->assertNotNull($business->fresh()->description);
    }

    public function test_publication_requires_verified_real_location_and_accepts_overnight_hours(): void
    {
        $this->seed();
        $this->admin();
        $data = $this->completeData();
        $data['location_verified'] = false;
        $data['hours'] = [['day_of_week' => 5, 'is_closed' => false, 'opens_at' => '20:00', 'closes_at' => '02:00']];
        $response = $this->postJson('/api/admin/businesses', $data)->assertCreated();
        $id = $response->json('data.id');
        $this->assertDatabaseHas('business_hours', ['business_id' => $id, 'day_of_week' => 5]);
        $this->patchJson("/api/admin/businesses/$id/publish")->assertUnprocessable()
            ->assertJsonValidationErrors('location_verified');
        $this->putJson("/api/admin/businesses/$id", ['latitude' => 100])->assertUnprocessable()
            ->assertJsonValidationErrors('latitude');
        $this->assertDatabaseHas('businesses', ['id' => $id, 'status' => 'draft']);
        $this->putJson("/api/admin/businesses/$id", ['location_verified' => true])->assertOk();
        $this->patchJson("/api/admin/businesses/$id/publish")->assertOk();
        $this->putJson("/api/admin/businesses/$id", ['address' => null])->assertUnprocessable()
            ->assertJsonValidationErrors('address');
        $this->assertSame('published', Business::findOrFail($id)->status);
    }

    public function test_archiving_hides_related_advertisements_and_updates_dashboard(): void
    {
        $this->seed();
        $this->admin();
        $ad = Advertisement::active()->firstOrFail();
        $business = $ad->business;
        $before = Advertisement::active()->count();
        $this->patchJson("/api/admin/businesses/$business->id/archive")->assertOk();
        $this->assertDatabaseHas('advertisements', ['id' => $ad->id]);
        $this->assertSame($before - 1, Advertisement::active()->count());
        $this->getJson('/api/advertisements')->assertDontSee('"id":'.$ad->id);
        $this->getJson('/api/admin/dashboard')->assertJsonPath('data.archived_businesses', 3)
            ->assertJsonPath('data.published_businesses', 25);
    }

    public function test_guests_and_non_admins_cannot_modify_businesses(): void
    {
        $this->seed();
        $business = Business::firstOrFail();
        $this->postJson('/api/admin/businesses', ['name' => 'Blocked'])->assertUnauthorized();
        $this->putJson("/api/admin/businesses/$business->id", ['name' => 'Blocked'])->assertUnauthorized();
        $this->patchJson("/api/admin/businesses/$business->id/archive")->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/admin/businesses', ['name' => 'Blocked'])->assertForbidden();
        $this->patchJson("/api/admin/businesses/$business->id/archive")->assertForbidden();
        $this->assertDatabaseMissing('businesses', ['name' => 'Blocked']);
        $this->assertSame('published', $business->fresh()->status);
    }

    public function test_logout_blocks_a_later_write_without_changing_data(): void
    {
        $this->seed();
        $this->admin();
        $before = Business::count();
        $this->postJson('/api/admin/logout')->assertOk();
        $this->postJson('/api/admin/businesses', ['name' => 'Blocked after logout'])->assertUnauthorized();
        $this->assertSame($before, Business::count());
    }

    public function test_image_upload_is_validated_and_stored_without_removing_existing_images(): void
    {
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::where('slug', 'demo-biznes-02')->firstOrFail();
        $oldImages = $business->images()->count();
        $this->postJson("/api/admin/businesses/$business->id/images", [
            'image' => UploadedFile::fake()->create('bad.php', 2, 'text/plain'),
            'kind' => 'logo', 'alt_text' => 'Imazh i keq',
        ])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->assertSame($oldImages, $business->images()->count());
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=');
        $response = $this->postJson("/api/admin/businesses/$business->id/images", [
            'image' => UploadedFile::fake()->createWithContent('logo.png', $png),
            'kind' => 'logo', 'alt_text' => 'Logo e biznesit',
        ])->assertCreated();
        $this->assertSame($oldImages + 1, $business->images()->count());
        $newImage = $business->images()->where('alt_text', 'Logo e biznesit')->firstOrFail();
        Storage::disk('public')->assertExists(substr($newImage->path, strlen('/storage/')));
        $this->assertCount($oldImages + 1, $response->json('data.images'));
        $this->deleteJson("/api/admin/businesses/$business->id/images/$newImage->id")->assertOk();
        $this->assertSame($oldImages, $business->images()->count());
    }

    public function test_business_image_upload_rejects_malformed_and_disguised_files(): void
    {
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::firstOrFail();
        foreach ([
            UploadedFile::fake()->createWithContent('script.php', '<?php echo "no";'),
            UploadedFile::fake()->createWithContent('script.jpg', '<?php echo "no";'),
            UploadedFile::fake()->createWithContent('image.svg', '<svg></svg>'),
            UploadedFile::fake()->createWithContent('broken.webp', 'not an image'),
        ] as $upload) {
            $this->postJson("/api/admin/businesses/$business->id/images", [
                'image' => $upload, 'kind' => 'gallery', 'alt_text' => 'Test image',
            ])->assertUnprocessable()->assertJsonValidationErrors('image');
        }
        $this->assertSame(0, $business->images()->where('path', 'like', '%businesses/'.$business->id.'/%')->count());
    }

    public function test_valid_png_content_with_a_different_allowed_extension_is_rejected(): void
    {
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::firstOrFail();
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=');

        foreach (['logo.jpg', 'logo.webp'] as $name) {
            $this->postJson("/api/admin/businesses/$business->id/images", [
                'image' => UploadedFile::fake()->createWithContent($name, $png),
                'kind' => 'gallery', 'alt_text' => 'Test image',
            ])->assertUnprocessable()->assertJsonValidationErrors('image');
        }
    }
}
