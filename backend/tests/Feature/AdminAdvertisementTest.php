<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use App\Models\Business;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminAdvertisementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));
    }

    private function fields(Business $business, array $changes = []): array
    {
        $start = now()->subMinute();
        $end = now()->addMinute();

        return array_merge([
            'business_id' => $business->id,
            'placement' => 'home_banner',
            'alt_text' => 'Pamje reklamuese e biznesit demo',
            'destination' => 'https://example.com/reklama',
            'starts_at_local' => $start->timezone('Europe/Belgrade')->format('Y-m-d\TH:i'),
            'ends_at_local' => $end->timezone('Europe/Belgrade')->format('Y-m-d\TH:i'),
            'priority' => 100,
            'is_active' => true,
        ], $changes);
    }

    private function image(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('banner.png', base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII='
        ));
    }

    public function test_administrator_can_list_filter_create_edit_toggle_and_delete_advertisements(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-27T12:00:00Z'));
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::where('slug', 'demo-biznes-02')->firstOrFail();
        $this->getJson('/api/admin/advertisements?q=Shporta&placement=home_banner&status=active_now')
            ->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.business.id', $business->id);

        $created = $this->post('/api/admin/advertisements', $this->fields($business) + ['image' => $this->image()],
            ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.status', 'active_now');
        $id = $created->json('data.id');
        $path = $created->json('data.image_path');
        Storage::disk('public')->assertExists(substr($path, strlen('/storage/')));
        $this->getJson('/api/advertisements?placement=home_banner')->assertJsonPath('data.0.id', $id);
        $this->getJson('/api/admin/dashboard')->assertJsonPath('data.active_advertisements', 4);
        $this->getJson('/api/admin/advertisements?status=active_now')->assertJsonPath('total', 4);

        $this->putJson("/api/admin/advertisements/$id", $this->fields($business, [
            'placement' => 'results_sidebar', 'priority' => 101, 'alt_text' => 'Pamje e ndryshuar',
        ]))->assertOk()->assertJsonPath('data.image_path', $path)->assertJsonPath('data.placement', 'results_sidebar');
        $this->getJson('/api/advertisements?placement=results_sidebar')->assertJsonPath('data.0.id', $id);
        $this->patchJson("/api/admin/advertisements/$id/toggle", ['is_active' => false])
            ->assertOk()->assertJsonPath('data.status', 'disabled');
        $this->getJson('/api/admin/dashboard')->assertJsonPath('data.active_advertisements', 3);
        $this->getJson('/api/admin/advertisements?status=disabled')->assertJsonPath('total', 2);
        $this->getJson('/api/advertisements?placement=results_sidebar')->assertJsonMissing(['id' => $id]);
        $this->patchJson("/api/admin/advertisements/$id/toggle", ['is_active' => true])->assertJsonPath('data.status', 'active_now');
        $this->deleteJson("/api/admin/advertisements/$id")->assertOk();
        $this->assertDatabaseMissing('advertisements', ['id' => $id]);
        Storage::disk('public')->assertMissing(substr($path, strlen('/storage/')));
        $this->assertDatabaseHas('businesses', ['id' => $business->id]);
    }

    public function test_invalid_fields_and_images_leave_existing_advertisement_unchanged(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-27T12:00:00Z'));
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::where('slug', 'demo-biznes-02')->firstOrFail();
        $count = Advertisement::count();
        $this->post('/api/admin/advertisements', $this->fields($business) + ['image' => UploadedFile::fake()->create('bad.php', 1, 'text/plain')],
            ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->post('/api/admin/advertisements', $this->fields($business) + ['image' => UploadedFile::fake()->create('large.png', 5121, 'image/png')],
            ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->assertSame($count, Advertisement::count());

        $ad = Advertisement::firstOrFail();
        $original = $ad->only(['business_id', 'placement', 'image_path', 'priority', 'starts_at', 'ends_at']);
        foreach ([
            ['business_id' => 999999], ['placement' => 'unknown'], ['destination' => 'javascript:alert(1)'],
            ['alt_text' => ''], ['alt_text' => '   '], ['priority' => 65536],
            ['ends_at_local' => $this->fields($business)['starts_at_local']],
            ['ends_at_local' => now()->subDay()->timezone('Europe/Belgrade')->format('Y-m-d\TH:i')],
        ] as $change) {
            $this->putJson("/api/admin/advertisements/$ad->id", $this->fields($business, $change))
                ->assertUnprocessable();
            $this->assertEquals($original, $ad->fresh()->only(array_keys($original)));
        }
        $this->post("/api/admin/advertisements/$ad->id/image", ['image' => UploadedFile::fake()->create('bad.php', 1, 'text/plain')],
            ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->assertSame($original['image_path'], $ad->fresh()->image_path);
    }

    public function test_image_replacement_preserves_seeded_assets_and_removes_only_owned_uploads(): void
    {
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $ad = Advertisement::firstOrFail();
        $this->post("/api/admin/advertisements/$ad->id/image", ['image' => $this->image()],
            ['Accept' => 'application/json'])->assertOk();
        $firstPath = $ad->fresh()->image_path;
        $this->assertSame('/demo/photos/01.jpg', $ad->getOriginal('image_path'));
        $this->post("/api/admin/advertisements/$ad->id/image", ['image' => $this->image()],
            ['Accept' => 'application/json'])->assertOk();
        $secondPath = $ad->fresh()->image_path;
        $this->assertNotSame($firstPath, $secondPath);
        Storage::disk('public')->assertMissing(substr($firstPath, strlen('/storage/')));
        Storage::disk('public')->assertExists(substr($secondPath, strlen('/storage/')));
        $this->deleteJson("/api/admin/advertisements/$ad->id")->assertOk();
        Storage::disk('public')->assertMissing(substr($secondPath, strlen('/storage/')));
    }

    public function test_schedule_boundaries_fallback_dashboard_and_business_counts(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-27T12:00:00Z'));
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::where('slug', 'demo-biznes-02')->firstOrFail();
        $beforeTotal = $this->getJson('/api/businesses')->json('meta.total');
        $ad = $this->post('/api/admin/advertisements', $this->fields($business, [
            'starts_at_local' => '2026-10-27T13:01', 'ends_at_local' => '2026-10-27T13:02',
        ]) + ['image' => $this->image()], ['Accept' => 'application/json'])->assertCreated();
        $id = $ad->json('data.id');
        $this->getJson('/api/advertisements?placement=home_banner')->assertJsonPath('data.0.business.slug', 'demo-biznes-02');
        $this->getJson('/api/admin/advertisements?status=scheduled')->assertJsonPath('total', 2);
        $this->travelTo(CarbonImmutable::parse('2026-10-27T12:01:00Z'));
        $this->getJson('/api/advertisements?placement=home_banner')->assertJsonPath('data.0.id', $id);
        $this->travelTo(CarbonImmutable::parse('2026-10-27T12:01:59Z'));
        $this->getJson('/api/advertisements?placement=home_banner')->assertJsonPath('data.0.id', $id);
        $this->travelTo(CarbonImmutable::parse('2026-10-27T12:02:00Z'));
        $this->getJson('/api/advertisements?placement=home_banner')->assertJsonMissing(['id' => $id]);
        $this->getJson('/api/advertisements?placement=home_banner')->assertJsonPath('data.0.business.slug', 'demo-biznes-02');
        $this->getJson('/api/admin/advertisements?status=expired')->assertJsonPath('total', 2);
        $this->getJson('/api/admin/dashboard')->assertJsonPath('data.active_advertisements', 3);
        $this->getJson('/api/businesses')->assertJsonPath('meta.total', $beforeTotal);
        $this->getJson('/api/businesses?category=gastronomi')->assertJsonPath('meta.total', 5);
        $this->patchJson("/api/admin/businesses/$business->id/archive")->assertOk();
        $this->getJson("/api/admin/advertisements/$id")->assertJsonPath('data.status', 'unpublished_business');
    }

    public function test_daylight_saving_gaps_and_repeated_hours_are_rejected(): void
    {
        $this->seed();
        $this->admin();
        $business = Business::firstOrFail();
        foreach (['2026-03-29T02:30', '2026-10-25T02:30'] as $local) {
            $this->post('/api/admin/advertisements', $this->fields($business, [
                'starts_at_local' => $local, 'ends_at_local' => '2026-10-28T12:00',
            ]) + ['image' => $this->image()], ['Accept' => 'application/json'])
                ->assertUnprocessable()->assertJsonValidationErrors('starts_at_local');
        }
    }

    public function test_local_summer_and_winter_times_are_stored_in_utc(): void
    {
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::firstOrFail();

        foreach ([
            ['2026-07-01T12:00', '2026-07-01T13:00', '2026-07-01 10:00:00'],
            ['2027-01-01T12:00', '2027-01-01T13:00', '2027-01-01 11:00:00'],
        ] as [$start, $end, $expectedUtc]) {
            $response = $this->post('/api/admin/advertisements', $this->fields($business, [
                'starts_at_local' => $start, 'ends_at_local' => $end,
            ]) + ['image' => $this->image()], ['Accept' => 'application/json'])->assertCreated();
            $this->assertSame($expectedUtc, Advertisement::findOrFail($response->json('data.id'))->getRawOriginal('starts_at'));
            $response->assertJsonPath('data.starts_at_local', $start);
        }
    }

    public function test_guests_and_ordinary_users_cannot_read_or_write_advertisements(): void
    {
        $this->seed();
        $business = Business::firstOrFail();
        $count = Advertisement::count();
        $this->getJson('/api/admin/advertisements')->assertUnauthorized();
        $this->postJson('/api/admin/advertisements', $this->fields($business))->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $this->getJson('/api/admin/advertisements')->assertForbidden();
        $this->putJson('/api/admin/advertisements/'.Advertisement::firstOrFail()->id, $this->fields($business))->assertForbidden();
        $this->assertSame($count, Advertisement::count());
    }

    public function test_malformed_and_disguised_uploads_are_rejected(): void
    {
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::firstOrFail();
        $appendedPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=').'APPENDED';
        foreach ([
            UploadedFile::fake()->createWithContent('script.php', '<?php echo "no";'),
            UploadedFile::fake()->createWithContent('script.jpg', '<?php echo "no";'),
            UploadedFile::fake()->createWithContent('double.php.jpg', '<html>no</html>'),
            UploadedFile::fake()->createWithContent('image.svg', '<svg></svg>'),
            UploadedFile::fake()->createWithContent('broken.png', 'not an image'),
            UploadedFile::fake()->createWithContent('appended.png', $appendedPng),
        ] as $upload) {
            $this->post('/api/admin/advertisements', $this->fields($business) + ['image' => $upload], ['Accept' => 'application/json'])
                ->assertUnprocessable()->assertJsonValidationErrors('image');
        }
        $this->assertSame(6, Advertisement::count());
    }

    public function test_valid_image_content_with_a_different_allowed_extension_is_rejected(): void
    {
        $this->seed();
        $this->admin();
        Storage::fake('public');
        $business = Business::firstOrFail();
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=');

        foreach (['image.jpg', 'image.webp'] as $name) {
            $this->post('/api/admin/advertisements', $this->fields($business) + [
                'image' => UploadedFile::fake()->createWithContent($name, $png),
            ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('image');
        }
        $this->assertSame(6, Advertisement::count());
    }
}
