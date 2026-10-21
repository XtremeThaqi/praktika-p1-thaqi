<?php

namespace App\Http\Controllers;

use App\Http\Resources\BusinessResource;
use App\Models\Business;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BusinessController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $businesses = Business::published()
            ->with(['category', 'settlement', 'images'])
            ->orderBy('name')->orderBy('id')
            ->paginate(12)->withQueryString();

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
