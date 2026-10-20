<?php

namespace Database\Seeders;

use App\Models\Advertisement;
use App\Models\Business;
use Illuminate\Database\Seeder;

class DemoAdvertisementSeeder extends Seeder
{
    public function run(): void
    {
        $now = now()->startOfSecond();
        $advertisements = [
            ['business' => 1, 'placement' => 'home_banner', 'start_days' => -2, 'end_days' => 14, 'priority' => 10, 'active' => true],
            ['business' => 2, 'placement' => 'home_banner', 'start_days' => -1, 'end_days' => 7, 'priority' => 20, 'active' => true],
            ['business' => 3, 'placement' => 'results_sidebar', 'start_days' => -2, 'end_days' => 7, 'priority' => 10, 'active' => true],
            ['business' => 4, 'placement' => 'home_banner', 'start_days' => 3, 'end_days' => 10, 'priority' => 30, 'active' => true],
            ['business' => 5, 'placement' => 'results_sidebar', 'start_days' => -10, 'end_days' => -1, 'priority' => 10, 'active' => true],
            ['business' => 6, 'placement' => 'home_banner', 'start_days' => -2, 'end_days' => 7, 'priority' => 40, 'active' => false],
        ];

        foreach ($advertisements as $data) {
            $business = Business::where('slug', sprintf('demo-biznes-%02d', $data['business']))
                ->where('is_demo', true)->firstOrFail();

            Advertisement::updateOrCreate([
                'business_id' => $business->id,
                'placement' => $data['placement'],
                'image_path' => '/demo/advertisement.svg',
            ], [
                'alt_text' => 'Reklamë demonstrimi për '.$business->name,
                'destination' => 'https://'.$business->slug.'.example.com',
                'starts_at' => $now->copy()->addDays($data['start_days']),
                'ends_at' => $now->copy()->addDays($data['end_days']),
                'priority' => $data['priority'],
                'is_active' => $data['active'],
            ]);
        }
    }
}
