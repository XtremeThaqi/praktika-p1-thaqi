<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use App\Models\Service;
use App\Models\Settlement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTaxonomyTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));
    }

    public function test_categories_can_be_searched_created_and_renamed_without_changing_slugs(): void
    {
        $this->seed();
        $this->admin();

        $this->getJson('/api/admin/categories?q=GASTRO')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.businesses_count', 5);
        $created = $this->postJson('/api/admin/categories', ['name' => '  Artizanat  '])
            ->assertCreated()->assertJsonPath('data.name', 'Artizanat')
            ->assertJsonPath('data.slug', 'artizanat')->assertJsonPath('data.businesses_count', 0);
        $id = $created->json('data.id');
        $this->getJson('/api/categories')->assertJsonFragment(['id' => $id, 'name' => 'Artizanat', 'slug' => 'artizanat']);
        $this->getJson('/api/businesses?category=artizanat')->assertJsonPath('meta.total', 0);

        $this->putJson("/api/admin/categories/$id", ['name' => 'Punime artizanale'])
            ->assertOk()->assertJsonPath('data.slug', 'artizanat');
        $this->getJson('/api/categories')->assertJsonFragment(['id' => $id, 'name' => 'Punime artizanale', 'slug' => 'artizanat']);
    }

    public function test_duplicate_invalid_names_and_slug_collisions_are_handled(): void
    {
        $this->seed();
        $this->admin();
        $count = Category::count();

        $this->postJson('/api/admin/categories', ['name' => '   '])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
        $this->postJson('/api/admin/categories', ['name' => 'gASTRONOMI'])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
        $this->postJson('/api/admin/categories', ['name' => '!!!'])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
        $this->assertSame($count, Category::count());

        $first = $this->postJson('/api/admin/categories', ['name' => 'Cafe Bar'])->assertCreated();
        $second = $this->postJson('/api/admin/categories', ['name' => 'Cafe-Bar'])->assertCreated();
        $this->assertSame('cafe-bar', $first->json('data.slug'));
        $this->assertSame('cafe-bar-2', $second->json('data.slug'));
        $this->putJson('/api/admin/categories/'.$second->json('data.id'), ['name' => 'Gastronomi'])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->assertDatabaseHas('categories', ['id' => $second->json('data.id'), 'name' => 'Cafe-Bar']);
    }

    public function test_referenced_categories_cannot_be_deleted_but_unused_categories_can(): void
    {
        $this->seed();
        $this->admin();
        $used = Category::create(['name' => 'Archived only', 'slug' => 'archived-only']);
        $business = Business::where('status', 'archived')->firstOrFail();
        $business->update(['category_id' => $used->id]);

        $this->deleteJson("/api/admin/categories/$used->id")->assertStatus(409);
        $this->assertDatabaseHas('categories', ['id' => $used->id]);
        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'category_id' => $used->id]);

        $unused = Category::create(['name' => 'Unused category', 'slug' => 'unused-category']);
        $this->deleteJson("/api/admin/categories/$unused->id")->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $unused->id]);
    }

    public function test_settlements_support_the_same_validation_counts_and_deletion_rules(): void
    {
        $this->seed();
        $this->admin();

        $created = $this->postJson('/api/admin/settlements', ['name' => '  Vendbanim i ri '])
            ->assertCreated()->assertJsonPath('data.slug', 'vendbanim-i-ri');
        $id = $created->json('data.id');
        $this->getJson('/api/settlements')->assertJsonFragment(['id' => $id, 'slug' => 'vendbanim-i-ri']);
        $this->putJson("/api/admin/settlements/$id", ['name' => 'Vendbanim tjetër'])
            ->assertOk()->assertJsonPath('data.slug', 'vendbanim-i-ri');
        $this->postJson('/api/admin/settlements', ['name' => 'LIPJAN'])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->deleteJson("/api/admin/settlements/$id")->assertOk();

        $used = Settlement::create(['name' => 'Draft only', 'slug' => 'draft-only']);
        $business = Business::where('status', 'draft')->firstOrFail();
        $business->update(['settlement_id' => $used->id]);
        $this->deleteJson("/api/admin/settlements/$used->id")->assertStatus(409);
        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'settlement_id' => $used->id]);
    }

    public function test_visitors_and_ordinary_users_cannot_change_taxonomies(): void
    {
        $this->seed();
        $count = Category::count();
        $this->postJson('/api/admin/categories', ['name' => 'Nuk lejohet'])->assertUnauthorized();
        $this->getJson('/api/admin/categories')->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/admin/categories', ['name' => 'Nuk lejohet'])->assertForbidden();
        $this->deleteJson('/api/admin/settlements/'.Settlement::firstOrFail()->id)->assertForbidden();
        $this->postJson('/api/admin/services', ['name' => 'Nuk lejohet'])->assertForbidden();
        $this->assertSame($count, Category::count());
        $this->assertDatabaseMissing('categories', ['name' => 'Nuk lejohet']);
    }

    public function test_new_category_flows_through_business_creation_and_public_filter(): void
    {
        $this->seed();
        $this->admin();
        $category = $this->postJson('/api/admin/categories', ['name' => 'Artizanat'])->assertCreated();
        $categoryId = $category->json('data.id');
        $this->getJson('/api/categories')->assertJsonFragment(['id' => $categoryId, 'name' => 'Artizanat']);
        $this->getJson('/api/businesses?category=artizanat')->assertJsonPath('meta.total', 0);

        $business = $this->postJson('/api/admin/businesses', [
            'name' => 'Punishtja demo', 'description' => 'Punime artizanale për demonstrim.',
            'category_id' => $categoryId, 'settlement_id' => Settlement::firstOrFail()->id,
            'address' => 'Adresa demo', 'phone' => '+383 44 123 456',
            'latitude' => 42.52, 'longitude' => 21.12, 'location_verified' => true,
            'is_demo' => true,
        ])->assertCreated();
        $id = $business->json('data.id');
        $this->patchJson("/api/admin/businesses/$id/publish")->assertOk();
        $this->getJson('/api/businesses?category=artizanat')->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $id);
        $this->getJson('/api/businesses/'.$business->json('data.slug'))
            ->assertOk()->assertJsonPath('data.category.name', 'Artizanat');
        $this->assertSame($categoryId, Business::findOrFail($id)->category_id);
    }

    public function test_services_can_be_searched_created_and_renamed(): void
    {
        $this->seed();
        $this->admin();

        $this->getJson('/api/admin/services?q=DERG')->assertOk()->assertJsonCount(1, 'data');
        $created = $this->postJson('/api/admin/services', ['name' => 'Punime me dorë'])
            ->assertCreated()->assertJsonPath('data.slug', 'punime-me-dore')
            ->assertJsonPath('data.businesses_count', 0);
        $id = $created->json('data.id');
        $this->getJson('/api/services')->assertJsonFragment(['id' => $id, 'slug' => 'punime-me-dore']);
        $this->putJson("/api/admin/services/$id", ['name' => 'Punime artizanale'])
            ->assertOk()->assertJsonPath('data.slug', 'punime-me-dore');
        $this->postJson('/api/admin/services', ['name' => 'DËRGESA'])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->assertDatabaseHas('services', ['id' => $id, 'name' => 'Punime artizanale']);
    }

    public function test_deleting_a_service_requires_its_name_and_removes_only_service_links(): void
    {
        $this->seed();
        $this->admin();
        $service = Service::where('slug', 'dergesa')->firstOrFail();
        $business = $service->businesses()->where('status', 'published')->firstOrFail();
        $businessCount = Business::count();
        $links = $service->businesses()->count();
        $this->assertGreaterThan(0, $links);

        $this->deleteJson("/api/admin/services/$service->id", ['confirm_name' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('confirm_name');
        $this->assertDatabaseHas('business_service', ['business_id' => $business->id, 'service_id' => $service->id]);

        $this->deleteJson("/api/admin/services/$service->id", ['confirm_name' => $service->name])->assertOk();
        $this->assertDatabaseMissing('services', ['id' => $service->id]);
        $this->assertDatabaseMissing('business_service', ['business_id' => $business->id, 'service_id' => $service->id]);
        $this->assertSame($businessCount, Business::count());
        $this->getJson('/api/services')->assertJsonMissing(['slug' => 'dergesa']);
        $this->getJson('/api/businesses/'.$business->slug)->assertOk()
            ->assertJsonMissing(['slug' => 'dergesa']);
        $this->getJson('/api/businesses?service=dergesa')->assertUnprocessable();
    }
}
