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
        $businessTypes = [
            ['category' => 'gastronomi', 'name' => 'Kuzhina', 'services' => ['dergesa', 'merr-me-vete']],
            ['category' => 'tregti', 'name' => 'Dyqani', 'services' => ['dergesa', 'marrje-ne-dyqan']],
            ['category' => 'automjete', 'name' => 'Autoservisi', 'services' => ['riparime', 'rezervime']],
            ['category' => 'shendetesi', 'name' => 'Ordinanca', 'services' => ['konsultime', 'rezervime']],
            ['category' => 'teknologji', 'name' => 'Teknika', 'services' => ['instalim', 'riparime']],
            ['category' => 'sherbime-profesionale', 'name' => 'Studio', 'services' => ['konsultime', 'porosi-te-vecanta']],
        ];

        for ($number = 1; $number <= 30; $number++) {
            $type = $businessTypes[($number - 1) % count($businessTypes)];
            $settlement = $settlements[($number - 1) % $settlements->count()];
            $slug = sprintf('demo-biznes-%02d', $number);
            $status = 'published';

            if ($number === 27 || $number === 28) {
                $status = 'draft';
            } elseif ($number >= 29) {
                $status = 'archived';
            }

            $business = Business::updateOrCreate(['slug' => $slug, 'is_demo' => true], [
                'name' => sprintf('%s %02d (Demo)', $type['name'], $number),
                'description' => 'Biznes demonstrues për testimin e katalogut. Të dhënat, kontaktet dhe koordinatat janë të simuluara, jo informacion i verifikuar. Kategoria: '.$categories[$type['category']]->name.'.',
                'category_id' => $categories[$type['category']]->id,
                'settlement_id' => $settlement->id,
                'address' => 'Adresë demonstrimi '.$number.', '.$settlement->name.' (jo adresë reale)',
                'phone' => sprintf('+383 00 000 %03d', $number),
                'email' => $number % 2 === 0 ? $slug.'@example.com' : null,
                'website' => $number % 3 === 0 ? 'https://'.$slug.'.example.com' : null,
                'social_links' => $number % 4 === 0
                    ? ['instagram' => 'https://social.example.com/'.$slug] : null,
                'latitude' => 42.5000000 + $number * 0.0003,
                'longitude' => 21.1100000 + $number * 0.0003,
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

            if ($number % 2 === 0) {
                $business->images()->updateOrCreate(['sort_order' => 0], [
                    'path' => '/demo/business-logo.svg',
                    'alt_text' => 'Logo demonstrues, jo logo e një biznesi real.',
                    'kind' => 'logo',
                ]);
            }
            if ($number % 5 === 0) {
                $business->images()->updateOrCreate(['sort_order' => 1], [
                    'path' => '/demo/business-gallery.svg',
                    'alt_text' => 'Ilustrim demonstrues, jo fotografi e një biznesi real.',
                    'kind' => 'gallery',
                ]);
            }
        }
    }
}
