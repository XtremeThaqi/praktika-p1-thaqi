<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use App\Models\BusinessImage;
use App\Rules\SafeImage;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminAdvertisementController extends Controller
{
    private const ZONE = 'Europe/Belgrade';

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['sometimes', 'string', 'max:200'],
            'placement' => ['sometimes', Rule::in(['home_banner', 'results_sidebar'])],
            'status' => ['sometimes', Rule::in(['active_now', 'scheduled', 'expired', 'disabled', 'unpublished_business'])],
            'page' => ['sometimes', 'integer', 'min:1', 'max:100000'],
        ]);
        $query = Advertisement::with('business:id,name,slug,status,is_demo');
        if (filled($filters['q'] ?? null)) {
            $term = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower(trim($filters['q']))).'%';
            $query->whereHas('business', fn ($businesses) => $businesses->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", [$term]));
        }
        if (isset($filters['placement'])) {
            $query->where('placement', $filters['placement']);
        }
        $now = now();
        switch ($filters['status'] ?? null) {
            case 'active_now':
                $query->active();
                break;
            case 'disabled':
                $query->where('is_active', false);
                break;
            case 'unpublished_business':
                $query->where('is_active', true)->whereHas('business', fn ($businesses) => $businesses->where('status', '!=', 'published'));
                break;
            case 'scheduled':
                $query->where('is_active', true)->whereHas('business', fn ($businesses) => $businesses->published())
                    ->where('starts_at', '>', $now);
                break;
            case 'expired':
                $query->where('is_active', true)->whereHas('business', fn ($businesses) => $businesses->published())
                    ->where('ends_at', '<=', $now);
                break;
        }
        $page = $query->orderByDesc('created_at')->orderByDesc('id')->paginate(12)
            ->withPath('/api/admin/advertisements')->withQueryString();
        $page->getCollection()->transform(fn (Advertisement $advertisement) => $this->data($advertisement, $now));

        return response()->json($page)->header('Cache-Control', 'no-store');
    }

    public function show(Advertisement $advertisement): JsonResponse
    {
        return $this->detail($advertisement);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedFields($request);
        $image = $request->validate([
            'image' => ['nullable', new SafeImage],
            'business_image_id' => ['nullable', 'integer'],
        ]);
        $photo = $this->selectedPhoto($image['business_image_id'] ?? null, (int) $data['business_id']);
        if (isset($image['image']) === (bool) $photo) {
            throw ValidationException::withMessages(['image' => 'Zgjidhni një fotografi të biznesit ose ngarkoni një banner.']);
        }
        $storedPath = null;
        try {
            $advertisement = DB::transaction(function () use ($data, $image, $photo, &$storedPath) {
                $advertisement = Advertisement::create($data + ['image_path' => '/storage/pending']);
                $storedPath = $photo
                    ? $this->copyPhoto($photo, $advertisement->id)
                    : $image['image']->store('advertisements/'.$advertisement->id, 'public');
                if (! $storedPath) {
                    throw ValidationException::withMessages(['image' => 'Imazhi nuk mund të ruhej. Provoni përsëri.']);
                }
                $advertisement->update(['image_path' => '/storage/'.$storedPath]);

                return $advertisement;
            });
        } catch (\Throwable $error) {
            if ($storedPath) {
                Storage::disk('public')->delete($storedPath);
            }
            throw $error;
        }

        return $this->detail($advertisement, 201);
    }

    public function update(Request $request, Advertisement $advertisement): JsonResponse
    {
        $advertisement->update($this->validatedFields($request));

        return $this->detail($advertisement);
    }

    public function replaceImage(Request $request, Advertisement $advertisement): JsonResponse
    {
        $image = $request->validate([
            'image' => ['nullable', new SafeImage],
            'business_image_id' => ['nullable', 'integer'],
        ]);
        $photo = $this->selectedPhoto($image['business_image_id'] ?? null, $advertisement->business_id);
        if (isset($image['image']) === (bool) $photo) {
            throw ValidationException::withMessages(['image' => 'Zgjidhni një fotografi të biznesit ose ngarkoni një banner.']);
        }
        $newPath = $photo
            ? $this->copyPhoto($photo, $advertisement->id)
            : $image['image']->store('advertisements/'.$advertisement->id, 'public');
        if (! $newPath) {
            throw ValidationException::withMessages(['image' => 'Imazhi nuk mund të ruhej. Provoni përsëri.']);
        }
        $oldPath = $advertisement->image_path;
        try {
            $advertisement->update(['image_path' => '/storage/'.$newPath]);
        } catch (\Throwable $error) {
            Storage::disk('public')->delete($newPath);
            throw $error;
        }
        $this->deleteOwnedImage($advertisement->id, $oldPath);

        return $this->detail($advertisement);
    }

    public function toggle(Request $request, Advertisement $advertisement): JsonResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $advertisement->update($data);

        return $this->detail($advertisement);
    }

    public function destroy(Advertisement $advertisement): JsonResponse
    {
        $id = $advertisement->id;
        $path = $advertisement->image_path;
        $advertisement->delete();
        $this->deleteOwnedImage($id, $path);

        return response()->json(['message' => 'Reklama u fshi.'])->header('Cache-Control', 'no-store');
    }

    private function validatedFields(Request $request): array
    {
        if (is_string($request->input('alt_text'))) {
            $request->merge(['alt_text' => trim($request->input('alt_text'))]);
        }
        $data = $request->validate([
            'business_id' => ['required', 'integer', 'exists:businesses,id'],
            'placement' => ['required', Rule::in(['home_banner', 'results_sidebar'])],
            'alt_text' => ['required', 'string', 'min:3', 'max:255'],
            'destination' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'starts_at_local' => ['required', 'date_format:Y-m-d\TH:i'],
            'ends_at_local' => ['required', 'date_format:Y-m-d\TH:i'],
            'priority' => ['required', 'integer', 'between:0,65535'],
            'is_active' => ['sometimes', 'boolean'],
        ], [
            'required' => ':attribute kërkohet.',
            'url' => 'Destinacioni duhet të jetë lidhje HTTP ose HTTPS.',
        ], [
            'business_id' => 'Biznesi', 'placement' => 'Pozicioni', 'alt_text' => 'Teksti alternativ',
            'destination' => 'Destinacioni', 'starts_at_local' => 'Fillimi', 'ends_at_local' => 'Mbarimi',
            'priority' => 'Prioriteti',
        ]);
        $start = $this->localToUtc($data['starts_at_local'], 'starts_at_local');
        $end = $this->localToUtc($data['ends_at_local'], 'ends_at_local');
        if ($end->lessThanOrEqualTo($start)) {
            throw ValidationException::withMessages(['ends_at_local' => 'Mbarimi duhet të jetë pas fillimit.']);
        }
        unset($data['starts_at_local'], $data['ends_at_local']);
        $data['starts_at'] = $start;
        $data['ends_at'] = $end;

        return $data;
    }

    private function localToUtc(string $value, string $field): CarbonImmutable
    {
        $zone = new \DateTimeZone(self::ZONE);
        $localAsUtc = \DateTimeImmutable::createFromFormat('!Y-m-d\TH:i', $value, new \DateTimeZone('UTC'));
        $offsets = array_unique(array_column($zone->getTransitions($localAsUtc->getTimestamp() - 172800, $localAsUtc->getTimestamp() + 172800), 'offset'));
        $matches = [];
        foreach ($offsets as $offset) {
            $candidate = $localAsUtc->getTimestamp() - $offset;
            if ((new \DateTimeImmutable('@'.$candidate))->setTimezone($zone)->format('Y-m-d\TH:i') === $value) {
                $matches[] = $candidate;
            }
        }
        if (count($matches) !== 1) {
            throw ValidationException::withMessages([$field => 'Kjo orë lokale nuk është e qartë për shkak të ndërrimit të orës verore. Zgjidhni një orë tjetër.']);
        }

        return CarbonImmutable::createFromTimestampUTC($matches[0]);
    }

    private function deleteOwnedImage(int $id, string $path): void
    {
        $prefix = '/storage/advertisements/'.$id.'/';
        if (str_starts_with($path, $prefix) && ! str_contains(substr($path, strlen($prefix)), '/')
            && ! Advertisement::where('image_path', $path)->exists()) {
            Storage::disk('public')->delete(substr($path, strlen('/storage/')));
        }
    }

    private function selectedPhoto(?int $id, int $businessId): ?BusinessImage
    {
        if ($id === null) {
            return null;
        }

        $photo = BusinessImage::whereKey($id)->where('business_id', $businessId)->where('kind', 'gallery')->first();
        if (! $photo) {
            throw ValidationException::withMessages(['business_image_id' => 'Fotografia nuk i përket biznesit të zgjedhur.']);
        }

        return $photo;
    }

    private function copyPhoto(BusinessImage $photo, int $advertisementId): string
    {
        $path = $photo->path;
        $businessPrefix = '/storage/businesses/'.$photo->business_id.'/';
        if (str_starts_with($path, $businessPrefix)
            && ! preg_match('~[/\\\\]~', substr($path, strlen($businessPrefix)))) {
            $source = Storage::disk('public')->path(substr($path, strlen('/storage/')));
        } elseif (preg_match('~^/demo/photos/[0-9]{2}\.jpg$~', $path)) {
            $source = public_path(ltrim($path, '/'));
        } else {
            throw ValidationException::withMessages(['business_image_id' => 'Fotografia nuk është e disponueshme.']);
        }
        $extension = strtolower(pathinfo($source, PATHINFO_EXTENSION));
        $allowed = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
        if (! is_file($source) || ! isset($allowed[$extension]) || mime_content_type($source) !== $allowed[$extension]) {
            throw ValidationException::withMessages(['business_image_id' => 'Fotografia nuk është e disponueshme.']);
        }
        $target = 'advertisements/'.$advertisementId.'/'.Str::uuid().'.'.$extension;
        $contents = file_get_contents($source);
        if ($contents === false || ! Storage::disk('public')->put($target, $contents)) {
            throw ValidationException::withMessages(['business_image_id' => 'Fotografia nuk mund të ruhej. Provoni përsëri.']);
        }

        return $target;
    }

    private function detail(Advertisement $advertisement, int $status = 200): JsonResponse
    {
        $advertisement->refresh()->load('business:id,name,slug,status,is_demo');

        return response()->json(['data' => $this->data($advertisement, now())], $status)
            ->header('Cache-Control', 'no-store');
    }

    private function data(Advertisement $advertisement, \DateTimeInterface $now): array
    {
        if (! $advertisement->is_active) {
            $state = 'disabled';
        } elseif ($advertisement->business->status !== 'published') {
            $state = 'unpublished_business';
        } elseif ($advertisement->starts_at > $now) {
            $state = 'scheduled';
        } elseif ($advertisement->ends_at <= $now) {
            $state = 'expired';
        } else {
            $state = 'active_now';
        }

        return [
            'id' => $advertisement->id,
            'business' => $advertisement->business->only(['id', 'name', 'slug', 'status', 'is_demo']),
            'image_path' => $advertisement->image_path,
            'alt_text' => $advertisement->alt_text,
            'destination' => $advertisement->destination,
            'placement' => $advertisement->placement,
            'starts_at' => $advertisement->starts_at->toIso8601String(),
            'ends_at' => $advertisement->ends_at->toIso8601String(),
            'starts_at_local' => $advertisement->starts_at->copy()->timezone(self::ZONE)->format('Y-m-d\TH:i'),
            'ends_at_local' => $advertisement->ends_at->copy()->timezone(self::ZONE)->format('Y-m-d\TH:i'),
            'priority' => $advertisement->priority,
            'is_active' => $advertisement->is_active,
            'status' => $state,
        ];
    }
}
