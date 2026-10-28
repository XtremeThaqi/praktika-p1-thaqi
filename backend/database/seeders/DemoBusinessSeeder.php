<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Category;
use App\Models\Service;
use App\Models\Settlement;
use Illuminate\Database\Seeder;

class DemoBusinessSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::whereIn('slug', [
            'gastronomi', 'tregti', 'automjete', 'shendetesi', 'teknologji', 'sherbime-profesionale',
        ])->get()->keyBy('slug');
        $settlements = Settlement::whereIn('slug', ['lipjan', 'janjeve', 'magure', 'sllovi'])
            ->orderBy('id')->get();
        $services = Service::pluck('id', 'slug');
        $profiles = collect(json_decode(file_get_contents(__DIR__.'/presentation-businesses.json'), true, flags: JSON_THROW_ON_ERROR))
            ->keyBy('number');
        $photos = collect(json_decode(file_get_contents(__DIR__.'/presentation-photos.json'), true, flags: JSON_THROW_ON_ERROR))
            ->keyBy('number');
        $businessTypes = [
            ['category' => 'gastronomi', 'services' => ['dergesa', 'merr-me-vete']],
            ['category' => 'tregti', 'services' => ['dergesa', 'marrje-ne-dyqan']],
            ['category' => 'automjete', 'services' => ['riparime', 'rezervime']],
            ['category' => 'shendetesi', 'services' => ['konsultime', 'rezervime']],
            ['category' => 'teknologji', 'services' => ['instalim', 'riparime']],
            ['category' => 'sherbime-profesionale', 'services' => ['konsultime', 'porosi-te-vecanta']],
        ];

        for ($number = 1; $number <= 30; $number++) {
            $type = $businessTypes[($number - 1) % count($businessTypes)];
            $settlement = $settlements[($number - 1) % $settlements->count()];
            $slug = sprintf('demo-biznes-%02d', $number);
            $profile = $profiles[$number];
            $status = 'published';

            if ($number === 27 || $number === 28) {
                $status = 'draft';
            } elseif ($number >= 29) {
                $status = 'archived';
            }

            $business = Business::updateOrCreate(['slug' => $slug, 'is_demo' => true], [
                'name' => $profile['name'],
                'description' => $profile['description'],
                'category_id' => $categories[$type['category']]->id,
                'settlement_id' => $settlement->id,
                'address' => null,
                'phone' => null,
                'email' => null,
                'website' => null,
                'social_links' => null,
                'latitude' => null,
                'longitude' => null,
                'location_verified' => false,
                'status' => $status,
                'is_featured' => $number <= 6,
            ]);

            // Keep one incomplete draft to exercise the future admin form.
            if ($number === 28) {
                $business->update([
                    'description' => null, 'category_id' => null, 'settlement_id' => null,
                    'address' => null, 'phone' => null, 'latitude' => null, 'longitude' => null,
                ]);
            }

            $serviceSlugs = $type['services'];
            if ($number % 2 === 0) {
                $serviceSlugs[] = 'parking';
            }
            if ($number % 3 === 0) {
                $serviceSlugs[] = 'pagese-me-kartele';
            }
            $business->services()->sync($services->only($serviceSlugs)->values()->all());

            if ($number % 3 !== 0) {
                for ($day = 0; $day <= 6; $day++) {
                    $business->hours()->updateOrCreate(['day_of_week' => $day], [
                        'opens_at' => $day === 0 ? null : '08:00:00',
                        'closes_at' => $day === 0 ? null : '17:00:00',
                        'is_closed' => $day === 0,
                    ]);
                }
            }

            // These paths are reserved for the seeder; uploaded paths live under /storage.
            $business->images()->where('path', '/demo/business-gallery.svg')->delete();
            if ($number <= 26) {
                $photoPath = sprintf('/demo/photos/%02d.jpg', $number);
                $ownedImage = $business->images()->whereIn('path', [$photoPath, '/demo/business-logo.svg'])->first();
                if ($ownedImage) {
                    $ownedImage->update([
                        'path' => $photoPath,
                        'alt_text' => $photos[$number]['alt'].'; fotografi ilustruese.',
                        'kind' => 'gallery',
                    ]);
                } elseif (! $business->images()->exists()) {
                    $business->images()->create([
                        'sort_order' => 0,
                        'path' => $photoPath,
                        'alt_text' => $photos[$number]['alt'].'; fotografi ilustruese.',
                        'kind' => 'gallery',
                    ]);
                }
            }
            $business->images()->where('path', '/demo/business-logo.svg')->delete();
        }
    }
}
