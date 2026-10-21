<?php

namespace App\Http\Controllers;

use App\Http\Requests\BusinessIndexRequest;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BusinessController extends Controller
{
    public function index(BusinessIndexRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $query = Business::published()->with(['category', 'settlement', 'images']);

        if ($request->filled('q')) {
            // Escape LIKE wildcards so punctuation is searched literally on both engines.
            $search = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($filters['q'])).'%';
            $query->where(function (Builder $businesses) use ($search) {
                $businesses->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", [$search])
                    ->orWhereRaw("LOWER(description) LIKE ? ESCAPE '!'", [$search]);
            });
        }

        if (! empty($filters['category'])) {
            $query->whereHas('category', fn (Builder $categories) => $categories->where('slug', $filters['category']));
        }
        if (! empty($filters['settlement'])) {
            $query->whereHas('settlement', fn (Builder $settlements) => $settlements->where('slug', $filters['settlement']));
        }
        if (! empty($filters['service'])) {
            $query->whereHas('services', fn (Builder $services) => $services->where('slug', $filters['service']));
        }
        if ($request->boolean('has_website')) {
            $query->whereNotNull('website')->whereRaw("TRIM(website) <> ''");
        }
        if ($request->boolean('has_hours')) {
            $query->has('hours');
        }

        switch ($filters['sort'] ?? 'name_asc') {
            case 'name_desc':
                $query->orderByDesc('name');
                break;
            case 'newest':
                $query->orderByDesc('created_at');
                break;
            default:
                $query->orderBy('name');
        }

        $businesses = $query->orderBy('id')->paginate(12)
            ->withPath('/api/businesses')->withQueryString();

        return BusinessResource::collection($businesses);
    }

    public function show(string $slug): BusinessResource
    {
        $business = Business::published()
            ->with(['category', 'settlement', 'services', 'hours', 'images'])
            ->where('slug', $slug)->firstOrFail();

        return new BusinessResource($business);
    }
}
