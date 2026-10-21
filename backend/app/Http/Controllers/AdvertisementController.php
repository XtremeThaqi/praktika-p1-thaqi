<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdvertisementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'placement' => ['nullable', 'string', Rule::in(['home_banner', 'results_sidebar'])],
        ]);
        $placements = isset($filters['placement']) ? [$filters['placement']] : ['home_banner', 'results_sidebar'];
        $advertisements = [];

        foreach ($placements as $placement) {
            $advertisement = Advertisement::active()->where('placement', $placement)
                ->with('business:id,name,slug,is_demo')
                ->orderByDesc('priority')->orderBy('created_at')->orderBy('id')->first();

            if ($advertisement) {
                $advertisements[] = [
                    'id' => $advertisement->id,
                    'image_path' => $advertisement->image_path,
                    'alt_text' => $advertisement->alt_text,
                    'destination' => $advertisement->destination,
                    'placement' => $advertisement->placement,
                    'business' => $advertisement->business->only(['id', 'name', 'slug', 'is_demo']),
                ];
            }
        }

        return response()->json(['data' => $advertisements])->header('Cache-Control', 'no-store');
    }
}
