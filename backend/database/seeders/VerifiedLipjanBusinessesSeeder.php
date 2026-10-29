<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Category;
use App\Models\Settlement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VerifiedLipjanBusinessesSeeder extends Seeder
{
    /**
     * Optional, source-documented public listings for a demonstrable map.
     *
     * Run explicitly: php artisan db:seed --class=VerifiedLipjanBusinessesSeeder
     * This seeder never rewrites existing business rows or administrator edits.
     */
    public function run(): void
    {
        $records = [
            [
                'slug' => 'restaurant-mangall-janjeve',
                'name' => 'Restaurant Mangall',
                'category' => 'gastronomi',
                'settlement' => 'janjeve',
                'settlement_name' => 'Janjevë',
                'description' => 'Restorant në Janjevë me kuzhinë tradicionale dhe bashkëkohore. Adresa, kontakti dhe orari janë publikuar nga vetë restoranti; vendndodhja është krahasuar me pikën e ndërtesës në OpenStreetMap.',
                'address' => 'Nallban Qeshme, Janjevë, Lipjan',
                'phone' => '+383 48 777 285',
                'email' => 'mangallrestaurant@gmail.com',
                'website' => 'https://mangall-restaurant.com/',
                'latitude' => 42.56316,
                'longitude' => 21.21836,
            ],
            [
                'slug' => 'neptun-lipjan',
                'name' => 'Neptun Lipjan',
                'category' => 'teknologji',
                'settlement' => 'lipjan',
                'settlement_name' => 'Lipjan',
                'description' => 'Dyqan i pajisjeve elektronike në rrugën Avdi Kelmendi në Lipjan. Adresa dhe numri i degës janë publikuar nga Neptun; pika e dyqanit është identifikuar në OpenStreetMap.',
                'address' => 'Rr. Avdi Kelmendi, Lipjan',
                'phone' => '+383 45 999 520',
                'email' => null,
                'website' => 'https://www.neptun-ks.com/',
                'latitude' => 42.52698,
                'longitude' => 21.11888,
            ],
            [
                'slug' => 'ramjani-babush',
                'name' => 'Ramjani SH.P.K.',
                'category' => 'tregti',
                'settlement' => 'babush-i-muhaxhereve',
                'settlement_name' => 'Babush i Muhaxherëve',
                'description' => 'Biznes në Babush i Muhaxherëve që ofron pajisje industriale, pirunë ngritës dhe pjesë për transport e mirëmbajtje. Kontakti, adresa dhe koordinatat janë publikuar në faqen zyrtare të kompanisë.',
                'address' => 'Babush i Muhaxherëve, Lipjan',
                'phone' => '+383 44 111 006',
                'email' => 'info@ramjani.com',
                'website' => 'https://ramjani.com/',
                'latitude' => 42.463137568,
                'longitude' => 21.172392443,
            ],
        ];

        DB::transaction(function () use ($records): void {
            foreach ($records as $record) {
                $category = Category::where('slug', $record['category'])->firstOrFail();
                $settlement = Settlement::firstOrCreate(
                    ['slug' => $record['settlement']],
                    ['name' => $record['settlement_name']]
                );

                // firstOrCreate preserves administrator edits on every subsequent run.
                Business::firstOrCreate(['slug' => $record['slug']], [
                    'name' => $record['name'],
                    'description' => $record['description'],
                    'category_id' => $category->id,
                    'settlement_id' => $settlement->id,
                    'address' => $record['address'],
                    'phone' => $record['phone'],
                    'email' => $record['email'],
                    'website' => $record['website'],
                    'latitude' => $record['latitude'],
                    'longitude' => $record['longitude'],
                    'location_verified' => true,
                    'status' => 'published',
                    'is_demo' => false,
                    'is_featured' => false,
                ]);
            }
        });
    }
}
