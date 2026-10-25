<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\BusinessImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminBusinessController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['sometimes', 'string', 'max:200'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
            'page' => ['sometimes', 'integer', 'min:1', 'max:100000'],
        ]);

        $query = Business::with(['category:id,name', 'settlement:id,name']);
        if (filled($filters['q'] ?? null)) {
            $term = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower(trim($filters['q']))).'%';
            $query->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", [$term]);
        }
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $page = $query->orderByDesc('updated_at')->orderByDesc('id')
            ->paginate(12)->withPath('/api/admin/businesses')->withQueryString();

        return response()->json($page)->header('Cache-Control', 'no-store');
    }

    public function show(Business $business): JsonResponse
    {
        return $this->detail($business);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedBusiness($request, false);
        $status = $data['status'] ?? 'draft';
        unset($data['status']);
        $this->checkPublication($data, $status);

        $business = DB::transaction(function () use ($data, $status) {
            $business = new Business;
            $business->fill(collect($data)->except(['services', 'hours'])->all());
            $base = Str::slug($business->name) ?: 'biznes';
            $slug = $base;
            $number = 2;
            while (Business::where('slug', $slug)->exists()) {
                $slug = $base.'-'.$number++;
            }
            $business->slug = $slug;
            $business->status = $status;
            $business->save();
            $this->saveRelationships($business, $data);

            return $business;
        });

        return $this->detail($business, 201);
    }

    public function update(Request $request, Business $business): JsonResponse
    {
        $data = $this->validatedBusiness($request, true);
        $next = array_merge($business->only([
            'name', 'description', 'category_id', 'settlement_id', 'address', 'phone',
            'latitude', 'longitude', 'location_verified', 'is_demo',
        ]), $data);
        if (array_key_exists('address', $data) || array_key_exists('latitude', $data) || array_key_exists('longitude', $data)) {
            $changed = collect(['address', 'latitude', 'longitude'])->contains(
                fn ($field) => array_key_exists($field, $data) && (string) $data[$field] !== (string) $business->$field
            );
            if ($changed && ! array_key_exists('location_verified', $data)) {
                $data['location_verified'] = false;
                $next['location_verified'] = false;
            }
        }
        $this->checkPublication($next, $business->status);

        DB::transaction(function () use ($business, $data) {
            $business->update(collect($data)->except(['services', 'hours'])->all());
            $this->saveRelationships($business, $data);
        });

        return $this->detail($business);
    }

    public function publish(Business $business): JsonResponse
    {
        if ($business->status !== 'draft') {
            throw ValidationException::withMessages(['status' => 'Vetëm një biznes në përgatitje mund të publikohet.']);
        }
        $this->checkPublication($business->toArray(), 'published');
        $business->update(['status' => 'published']);

        return $this->detail($business);
    }

    public function archive(Business $business): JsonResponse
    {
        if ($business->status === 'archived') {
            throw ValidationException::withMessages(['status' => 'Biznesi është tashmë i arkivuar.']);
        }
        $business->update(['status' => 'archived']);

        return $this->detail($business);
    }

    public function uploadImage(Request $request, Business $business): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'kind' => ['required', Rule::in(['logo', 'gallery'])],
            'alt_text' => ['required', 'string', 'max:255'],
        ]);
        $path = $data['image']->store('businesses/'.$business->id, 'public');
        if (! $path) {
            throw ValidationException::withMessages(['image' => 'Imazhi nuk mund të ruhej. Provoni përsëri.']);
        }
        try {
            DB::transaction(function () use ($business, $data, $path) {
                $order = (int) $business->images()->max('sort_order') + 1;
                $business->images()->create([
                    'path' => '/storage/'.$path,
                    'kind' => $data['kind'],
                    'alt_text' => $data['alt_text'],
                    'sort_order' => $order,
                ]);
            });
        } catch (\Throwable $error) {
            Storage::disk('public')->delete($path);
            throw $error;
        }

        return $this->detail($business, 201);
    }

    public function deleteImage(Business $business, BusinessImage $image): JsonResponse
    {
        abort_unless($image->business_id === $business->id, 404);
        $path = $image->path;
        $image->delete();
        if (str_starts_with($path, '/storage/businesses/'.$business->id.'/')) {
            Storage::disk('public')->delete(substr($path, strlen('/storage/')));
        }

        return $this->detail($business);
    }

    private function validatedBusiness(Request $request, bool $updating): array
    {
        $requiredName = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$requiredName, 'string', 'min:1', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'settlement_id' => ['sometimes', 'nullable', 'integer', 'exists:settlements,id'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40', 'regex:/^[+0-9() .\/-]{6,40}$/'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'website' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'social_links' => ['sometimes', 'nullable', 'array'],
            'social_links.*' => ['nullable', 'url:http,https', 'max:2048'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'location_verified' => ['sometimes', 'boolean'],
            'is_demo' => ['sometimes', 'boolean'],
            'status' => [$updating ? 'prohibited' : 'sometimes', Rule::in(['draft', 'published'])],
            'services' => ['sometimes', 'array'],
            'services.*' => ['integer', 'distinct', 'exists:services,id'],
            'hours' => ['sometimes', 'array'],
            'hours.*.day_of_week' => ['required', 'integer', 'between:0,6', 'distinct'],
            'hours.*.is_closed' => ['required', 'boolean'],
            'hours.*.opens_at' => ['nullable', 'date_format:H:i'],
            'hours.*.closes_at' => ['nullable', 'date_format:H:i'],
        ], [
            'required' => ':attribute kërkohet.',
            'exists' => ':attribute nuk është i vlefshëm.',
            'url' => ':attribute duhet të jetë lidhje HTTP ose HTTPS.',
            'phone.regex' => 'Shkruani një numër telefoni të vlefshëm.',
        ], [
            'name' => 'Emri', 'description' => 'Përshkrimi', 'category_id' => 'Kategoria',
            'settlement_id' => 'Vendbanimi', 'address' => 'Adresa', 'phone' => 'Telefoni',
            'latitude' => 'Gjerësia gjeografike', 'longitude' => 'Gjatësia gjeografike',
        ]);
    }

    private function checkPublication(array $data, string $status): void
    {
        if ($status !== 'published') {
            return;
        }
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'settlement_id' => ['required', 'integer', 'exists:settlements,id'],
            'address' => ['required', 'string'],
            'phone' => ['required', 'string', 'regex:/^[+0-9() .\/-]{6,40}$/'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ], [
            'required' => ':attribute kërkohet për publikim.',
            'exists' => ':attribute nuk është i vlefshëm.',
            'phone.regex' => 'Shkruani një numër telefoni të vlefshëm.',
        ], [
            'name' => 'Emri', 'description' => 'Përshkrimi', 'category_id' => 'Kategoria',
            'settlement_id' => 'Vendbanimi', 'address' => 'Adresa', 'phone' => 'Telefoni',
            'latitude' => 'Gjerësia gjeografike', 'longitude' => 'Gjatësia gjeografike',
        ]);
        $validator->after(function ($validator) use ($data) {
            if (empty($data['is_demo']) && empty($data['location_verified'])) {
                $validator->errors()->add('location_verified', 'Kontrolloni që koordinatat përputhen me adresën para publikimit.');
            }
        });
        $validator->validate();
    }

    private function saveRelationships(Business $business, array $data): void
    {
        if (array_key_exists('services', $data)) {
            $business->services()->sync($data['services']);
        }
        if (array_key_exists('hours', $data)) {
            $validator = Validator::make($data, []);
            foreach ($data['hours'] as $index => $hour) {
                $closed = $hour['is_closed'];
                if ($closed && (! empty($hour['opens_at']) || ! empty($hour['closes_at']))) {
                    $validator->errors()->add("hours.$index.opens_at", 'Dita e mbyllur nuk ka orar.');
                }
                if (! $closed && (empty($hour['opens_at']) || empty($hour['closes_at']) || $hour['opens_at'] === $hour['closes_at'])) {
                    $validator->errors()->add("hours.$index.closes_at", 'Ora e hapjes dhe e mbylljes duhet të jenë të ndryshme.');
                }
            }
            if ($validator->errors()->isNotEmpty()) {
                throw new ValidationException($validator);
            }
            $business->hours()->delete();
            $business->hours()->createMany($data['hours']);
        }
    }

    private function detail(Business $business, int $status = 200): JsonResponse
    {
        $business->refresh()->load(['category:id,name', 'settlement:id,name', 'services:id,name', 'hours', 'images']);

        return response()->json(['data' => $business], $status)->header('Cache-Control', 'no-store');
    }
}
