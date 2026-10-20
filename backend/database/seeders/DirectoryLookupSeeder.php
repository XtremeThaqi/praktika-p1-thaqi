<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Service;
use App\Models\Settlement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DirectoryLookupSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Gastronomi', 'Tregti', 'Automjete', 'Shëndetësi', 'Teknologji', 'Shërbime profesionale'] as $name) {
            Category::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name]);
        }

        foreach (['Lipjan', 'Janjevë', 'Magurë', 'Sllovi'] as $name) {
            Settlement::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name]);
        }

        foreach (['Dërgesa', 'Merr me vete', 'Marrje në dyqan', 'Rezervime', 'Konsultime',
            'Instalim', 'Riparime', 'Porosi të veçanta', 'Parking', 'Pagesë me kartelë'] as $name) {
            Service::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name]);
        }
    }
}
