<?php

namespace Tests\Feature;

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BusinessFiltersTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_is_trimmed_case_insensitive_and_groups_name_or_description(): void
    {
        $this->seed();
        $business = Business::where('slug', 'demo-biznes-01')->firstOrFail();
        $business->update(['name' => 'Unique bakery', 'description' => 'Special sourdough']);
        Business::where('status', 'draft')->update(['description' => 'Special sourdough']);
        foreach (['  UNIQUE BAKERY  ', 'SOURDOUGH'] as $search) {
            $this->getJson('/api/businesses?'.http_build_query(['q' => $search]))
                ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $business->id);
        }
        $this->getJson('/api/businesses?q=%20%20')->assertOk()->assertJsonPath('meta.total', 26);
        $this->getJson('/api/businesses?q=not-a-match')->assertOk()->assertJsonPath('meta.total', 0)->assertJsonCount(0, 'data');
        $this->getJson('/api/businesses?q=%25')->assertOk()->assertJsonPath('meta.total', 0);
        $business->update(['description' => 'Only code 0 matches here']);
        $this->getJson('/api/businesses?q=0')->assertOk()->assertJsonPath('meta.total', 11);
        $this->getJson('/api/businesses?q=%27%20OR%201%3D1')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_each_dynamic_filter_and_their_combination_use_and_logic(): void
    {
        $this->seed();
        $business = Business::where('slug', 'demo-biznes-02')->firstOrFail();
        $filters = ['category' => $business->category->slug, 'settlement' => $business->settlement->slug,
            'service' => $business->services->first()->slug];
        foreach ($filters as $key => $value) {
            $relationship = $key === 'service' ? 'services' : $key;
            $expected = Business::published()->whereHas($relationship, fn ($query) => $query->where('slug', $value))->count();
            $this->getJson('/api/businesses?'.http_build_query([$key => $value]))->assertOk()->assertJsonPath('meta.total', $expected);
        }
        $filters['q'] = $business->name;
        $filters['has_website'] = 1;
        $business->update(['website' => 'https://example.com']);
        $filters['has_hours'] = 1;
        $this->getJson('/api/businesses?'.http_build_query($filters))->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $business->id);
        $filters['settlement'] = 'lipjan';
        $this->getJson('/api/businesses?'.http_build_query($filters))->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_website_and_hours_filters_check_presence_not_open_now(): void
    {
        $this->seed();
        $business = Business::where('slug', 'demo-biznes-01')->firstOrFail();
        $business->update(['website' => '   ']);
        $this->getJson('/api/businesses?has_website=1')->assertOk()->assertJsonPath('meta.total', 8);
        $this->getJson('/api/businesses?has_website=0')->assertOk()->assertJsonPath('meta.total', 26);
        $business->hours()->delete();
        $business->hours()->create(['day_of_week' => 0, 'is_closed' => true]);
        $this->getJson('/api/businesses?q=Kuzhina%2001&has_hours=1')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/businesses?q=Autoservisi%2003&has_hours=1')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_sorting_is_stable_and_pagination_retains_filters(): void
    {
        $this->seed();
        Business::published()->update(['created_at' => now()->subDay()]);
        $newest = Business::where('slug', 'demo-biznes-01')->firstOrFail();
        $newest->forceFill(['created_at' => now()])->save();
        $this->getJson('/api/businesses?sort=newest')->assertOk()->assertJsonPath('data.0.id', $newest->id);
        foreach (['name_asc', 'name_desc', 'newest'] as $sort) {
            $query = Business::published();
            if ($sort === 'newest') {
                $query->orderByDesc('created_at');
            } else {
                $query->orderBy('name', $sort === 'name_asc' ? 'asc' : 'desc');
            }
            $expected = $query->orderBy('id')->pluck('id')->all();
            $actual = [];
            foreach ([1, 2, 3] as $page) {
                $response = $this->getJson('/api/businesses?'.http_build_query(['q' => 'Demo', 'sort' => $sort, 'page' => $page]))->assertOk();
                $actual = array_merge($actual, array_column($response->json('data'), 'id'));
                if ($page === 1) {
                    $this->assertStringContainsString('sort='.$sort, $response->json('links.next'));
                    $this->assertStringContainsString('q=Demo', $response->json('links.next'));
                }
            }
            $this->assertSame($expected, $actual);
        }
        $this->getJson('/api/businesses?page=99')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 26);
    }

    #[DataProvider('invalidQueries')]
    public function test_invalid_queries_return_422_json_without_debug_details(string $query, string $field): void
    {
        $response = $this->get('/api/businesses?'.$query)->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertArrayNotHasKey('exception', $response->json());
    }

    public static function invalidQueries(): array
    {
        return [['q[]=test', 'q'], ['q='.str_repeat('a', 201), 'q'], ['category=missing', 'category'],
            ['settlement[]=lipjan', 'settlement'], ['service=missing', 'service'], ['sort=unsafe', 'sort'],
            ['has_website=yes', 'has_website'], ['has_hours[]=1', 'has_hours'], ['page=0', 'page'],
            ['page=-1', 'page'], ['page=1.5', 'page'], ['page=100001', 'page'], ['page[]=1', 'page']];
    }
}
